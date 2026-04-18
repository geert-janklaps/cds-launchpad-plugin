import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as fsAsync from 'fs/promises'
import * as appindex from '@sap/cds/app/index'
//import * as cds from '@sap/cds-dk';
import { parse, parseLines, stringify } from 'dot-properties';
const cds = require('@sap/cds-dk');

const cdsLaunchpadLogger = cds.log('cds-launchpad-plugin');
export interface LaunchpadConfig {
  version?: string,
  theme?: string,
  basePath?: string,
  appConfigPath?: string,
  locale?: string, // TODO if it was possible to get sap-ui-language from request which retrieves the app config json, we wouldnt need this option
  template?: string,
  modulePaths?: object
}

export class cds_launchpad_plugin{
  setup (): express.Router{
    if (process.env.NODE_ENV === 'production') {
      cdsLaunchpadLogger.debug('Sandbox launchpad not initialized as the process runs in production ')
      return
    }
    // Load correct env for project path
    cds.env = cds.env.for("cds", cds.root ?? process.cwd());
    let options: LaunchpadConfig = cds.env.launchpad;
    const router = express.Router();

    cds.on('serving', async (service) => {
      const apiPath = options.basePath;
      const mount = apiPath.replace('$','[\\$]')
      cdsLaunchpadLogger._debug && cdsLaunchpadLogger.debug ('serving launchpad for ', {service: service.name, at: apiPath})

      // Mount path for launchpad page
      router.use(mount, async (request: express.Request, response: express.Response, next) => {
        const originalUrl = new URL(request.originalUrl, `${request.protocol}://${request.hostname}`);
        if (originalUrl.pathname === options.basePath) {
          response.send(await this.prepareTemplate(options));
        } else {
            next();
        }
      });

      // Mount path for launchpad sandbox configuration
      router.use('/appconfig/fioriSandboxConfig.json', async (request, response, next) => {
        // debugger;
        response.send(await this.prepareAppConfigJSON(options));
      });

      // Load correct env for project path
      cds.env = cds.env.for("cds", cds.root ?? process.cwd());
      // Component preload generation
      const componentPreloadCache = new Map()
      const _componentPreload = async (appName: String) => {
        if (componentPreloadCache.get(appName)) return componentPreloadCache.get(appName)
        const [manifest, component] = await Promise.all([
          fsAsync.readFile(cds.root + '/' + cds.env.folders.app + appName + '/webapp/manifest.json'),
          fsAsync.readFile(cds.root + '/' + cds.env.folders.app + appName + '/webapp/Component.js')
        ])
        const componentPreload =  `//@ui5-bundle preview/Component-preload.js
        jQuery.sap.registerPreloadedModules({
        "version":"2.0",
        "modules":{
          "preview/Component.js": function(){${component.toString()}
        },
          "preview/manifest.json":${manifest.toString()}
        }});`
        componentPreloadCache.set(appName, componentPreload)
        return componentPreload
      }
      router.get('/:app/webapp/Component-preload.js', async ({ params }, resp) => resp.send(await _componentPreload(params.app)))
    });

    // Modify default CAP index page (add launchpad link)
    router.get('/', (req, res, next) => {
      // store the references to the origin response methods
      const { end } = res;

      res.end = function(content: any, encoding: string): void {
          // Manipulate index page to include Sandbox Launchpad link
          if(typeof content !== 'string') {
            content = content.toString();
          }
          const htmlContent = content.replace(/<h2> Web Applications: <\/h2>/, `<h2><b><a href="${options.basePath}">Sandbox Launchpad</a></b></h2><h2>Web Applications: </h2>`);
          end.call(res, htmlContent, encoding);
      } as any;

      next();
    })

    return router;
  }

  async prepareTemplate(options: LaunchpadConfig): Promise<string>{
    let url = `https://ui5.sap.com`;
    let template = options.template === 'legacy' || options.template === '' || options.template === undefined ? 'legacy' : options.template;
    let htmltemplate = fs.readFileSync(__dirname + `/../templates/${template}/launchpad.html`).toString();
    if(options.modulePaths) {
        const modulePathsJson = JSON.stringify(options.modulePaths);
        htmltemplate = htmltemplate.replace('/* MODULE_PATHS */', `modulePaths: ${modulePathsJson}`);
    }
    if (options.version && options.version.startsWith('https://')) {
      url = options.version
    } else if(options.version !== undefined && options.version !== ''){
      url = url + '/' + options.version;
    }

    return htmltemplate.replace(/LIB_URL/g, url)
                       .replace(/THEME/g, options.theme);
  }

  getAppsFromDependencies(packagejson: any) {
    const appDirs = [], deps = [], depsPaths = [];
    deps.push(...Object.keys(packagejson.dependencies || {}));
    deps.push(...Object.keys(packagejson.devDependencies || {}));
    const cwd = process.cwd();
    appDirs.push(
        ...deps.filter((dep) => {
            try {
                require.resolve(path.join(dep, "webapp/manifest.json"), {
                    paths: [cwd],
                });
                return true;
            } catch (e) {
                return false;
            }
        })
    );
    // loop over appDirs and get root path
    appDirs.forEach((appDir) => {
      const manifestPath = require.resolve(path.join(appDir, "webapp/manifest.json"), {
				paths: [cwd],
			});
      let fullPath = manifestPath.replace(/manifest\.json$/, '');
      const object = { type: 'app', webappPath: fullPath, name: appDir};
      depsPaths.push(object);
    });
    return { appDirs, cwd, depsPaths };
}

  async prepareAppConfigJSON(options: LaunchpadConfig): Promise<string> {
    let template = options.template === 'legacy' || options.template === '' || options.template === undefined ? 'legacy' : options.template;

    // Read app config template
    const config = JSON.parse(fs.readFileSync(__dirname + `/../templates/${template}/appconfig.json`).toString());

    // Read externally provided config 
    const extConfig = options.appConfigPath ? JSON.parse(fs.readFileSync(options.appConfigPath).toString()) : {};

    // merge the two
    Object.assign(config, extConfig);
    // Load correct env for project path
    cds.env = cds.env.for("cds", cds.root ?? process.cwd());
    // Read CDS project package
    const packagejson = JSON.parse(fs.readFileSync(cds.root + '/package.json').toString());
    let depsPaths = [];
    if (cds.env?.plugins !== undefined && cds.env?.plugins['cds-plugin-ui5']) {
      try {
        ({ depsPaths } = this.getAppsFromDependencies(packagejson));
      } catch (error) {
        cdsLaunchpadLogger.error(`Error while reading dependencies: ${error}`);
      }
    }

    if(Array.isArray(packagejson.sapux)){
      packagejson.sapux.forEach(element => {
        const webappPath = ( cds.root + '/' + cds.env.folders.app + element.replace(cds.env.folders.app, '') + '/webapp/').toString();
        const object = {type : 'sapux', name: element, webappPath: webappPath};
        depsPaths.push(object);
      });
    }

    // Read manifest files for each UI project that is defined in the project package
      depsPaths.forEach(element => {
        const manifest = JSON.parse(fs.readFileSync(element.webappPath + 'manifest.json', 'utf8'));
        const appId = manifest["sap.app"].id;

        if (manifest["sap.flp"]?.type === 'plugin') {
            const component = appId;
            const name = component.split('.').pop();
            config.bootstrapPlugins[name] = {
                component,
                url: name + "/webapp",
                'sap-ushell-plugin-type': 'RendererExtensions',
                enabled: true
            }
            return;
        }

        let i18nsetting = manifest["sap.app"].i18n;
        let i18nPath = element.webappPath;
        if(typeof(i18nsetting) === "object") {
          if(manifest._version < "1.21.0") {
            cdsLaunchpadLogger.error(`manifest.json version of ${element.name} does not allow i18n being an object. Minumum version 1.21.0.`)
          }
          i18nPath += i18nsetting.bundleUrl;
        } else {
          i18nPath += i18nsetting;
        }

        if (options.locale) {
          i18nPath = i18nPath.replace(/(\.properties)$/,`_${options.locale}$1`);
        }
        const i18n = parse(fs.readFileSync( i18nPath ).toString());
        const tileconfigs = manifest["sap.app"]?.crossNavigation?.inbounds;

        for (const tileconfigId in tileconfigs){
          const tileconfig = tileconfigs[tileconfigId];
          const tileId = `${appId}-${tileconfigId}`;

          // Replace potential string templates used for tile title and description (take descriptions from default i18n file)
          Object.keys(tileconfig).forEach(key => {
            if(['title','subTitle','info'].includes(key)){
                const strippedValue = tileconfig[key].toString().replace(`{{`, ``).replace(`}}`, ``);
                
                if(i18n[strippedValue] !== undefined) {
                    tileconfig[key] = i18n[strippedValue];
                }
            }  
          });

          // App URL
          // Taking into account the use of cds-plugin-ui5 -> only the default route based on the component is supported for now
          // If no cds-plugin-ui5 loaded -> use default CAP routes (component/webapp)
          let url = `/${element.name.replace(cds.env.folders.app, '')}/webapp`;
          if (cds.env?.plugins !== undefined && cds.env?.plugins['cds-plugin-ui5']) {
            //url =  `/${element.path.replace(cds.env.folders.app, '')}`
            url = `/${appId}`; //cds-plugin-ui5 uses the appid as default route (combination namespace + component)
          }
          const component = `SAPUI5.Component=${appId}`;

          // App tile template - if not hidden from launchpad
          if (!tileconfig?.hideLauncher) {
            config.services.LaunchPage.adapter.config.groups[0].tiles.push({
              id: tileId, 
              properties: Object.assign({ 
                targetURL: `#${tileconfig.semanticObject}-${tileconfig.action}`, 
                title: tileconfig.title,
                info: tileconfig.info,
                subtitle: tileconfig.subTitle,
                icon: tileconfig.icon
              }, tileconfig.indicatorDataSource ? {
                serviceUrl: manifest["sap.app"].dataSources[tileconfig.indicatorDataSource.dataSource].uri + tileconfig.indicatorDataSource.path
              } : {} ), 
              tileType: tileconfig.indicatorDataSource ? 'sap.ushell.ui.tile.DynamicTile' : 'sap.ushell.ui.tile.StaticTile',
              serviceRefreshInterval: (tileconfig.indicatorDataSource && tileconfig.indicatorDataSource.refresh || 10) // defautl 10 sec
              // multiplying by a large number basically means "never refresh" - this can stay this way as long as
              // its not supported by the local adapter, see sap.ushell.adapters.local.LaunchPageAdapter, private function handleTileServiceCall,
              // which does the service calls correctly and regularly, but doesnt update the tiles
              * 1000 
            });
          }

          config.services.ClientSideTargetResolution.adapter.config.inbounds[tileId] = tileconfig;
          config.services.ClientSideTargetResolution.adapter.config.inbounds[tileId].resolutionResult = {
            "applicationType": "SAPUI5",
            "additionalInformation": component,
            "url": url
          };
        }
      });

    return config;
  }
}
