import * as express from 'express';
import * as fs from 'fs';
//import * as cds from '@sap/cds-dk';
import { parse, parseLines, stringify } from 'dot-properties';
const cds = require('@sap/cds-dk');

const LOG = cds.log('cds-launchpad-plugin');
export interface LaunchpadConfig {
  version?: string,
  theme?: string,
  basePath?: string
}

export class cds_launchpad_plugin{
  setup (options?: LaunchpadConfig): express.Router{
    options = options !== undefined ? options : {};
    options = options.basePath !== undefined ? options : Object.assign({ basePath:'/$launchpad' }, options);
    const router = express.Router();

    cds.on('serving', async (service) => {
      const apiPath = options.basePath;
      const mount = apiPath.replace('$','[\\$]')
      LOG._debug && LOG.debug ('serving launchpad for ', {service: service.name, at: apiPath})

      router.use(mount, async (request: express.Request, response: express.Response, next) => {
        response.send(await this.prepareTemplate(options));
        //next();
      });

      router.use('/appconfig/fioriSandboxConfig.json', async (request, response, next) => {
        debugger;
        response.send(await this.prepareAppConfigJSON());
      });

      this.addLinkToIndexHtml(service, apiPath)
    });

    return router;
  }

  async prepareTemplate(options: LaunchpadConfig): Promise<string>{
    let url = `https://sapui5.hana.ondemand.com`;
    let theme = options.theme ? options.theme : "sap_fiori_3";
    let htmltemplate = fs.readFileSync(__dirname + '/../templates/launchpad.html').toString();

    if(options.version !== undefined && options.version !== ''){
      url = url + '/' + options.version;
    }

    return htmltemplate.replace(/LIB_URL/g, url)
                       .replace(/THEME/g, theme);
  }

  async prepareAppConfigJSON(): Promise<string> {
    // Read app config template
    let config = JSON.parse(fs.readFileSync(__dirname + '/../templates/appconfig.json').toString());

    // Read CDS project package
    let packagejson = JSON.parse(fs.readFileSync(cds.root + '/package.json').toString());

    // Read manifest files for each UI project that is defined in the project package
    if(Array.isArray(packagejson.sapux)){
      let applications = {};

      packagejson.sapux.forEach(element => {
        let manifest = JSON.parse(fs.readFileSync(cds.root + '/' + element + '/webapp/manifest.json' ).toString());
        let i18n = parse(fs.readFileSync(cds.root + '/' + element + '/webapp/' + manifest["sap.app"].i18n ).toString());
        let tileconfig = manifest["sap.app"]?.crossNavigation?.inbounds[Object.keys(manifest["sap.app"]?.crossNavigation?.inbounds)[0]];

        if(tileconfig !== undefined){
          // Replace potential string templates used for tile title and description (take descriptions from default i18n file)
          Object.keys(tileconfig).forEach(key => {
            if(key === 'title' || key === 'subTitle'){
                tileconfig[key] = tileconfig[key].toString().replace(`{{`, ``).replace(`}}`, ``);
                
                if(i18n[tileconfig[key].toString()] !== undefined) {
                    tileconfig[key] = `${i18n[tileconfig[key].toString()]}`;
                }
            }  
          });

          // App URL
          let url = `/${element.replace(cds.env.folders.app, '')}/webapp`;
          let component = `SAPUI5.Component=${manifest["sap.app"].id}`;

          // App tile template
          config.services.LaunchPage.adapter.config.groups[0].tiles.push({ id: manifest["sap.app"].id, 
                                                                           properties: { 
                                                                            targetURL: `#${tileconfig.semanticObject}-${tileconfig.action}`, 
                                                                            title: `${tileconfig.title}`,
                                                                            info: `${tileconfig.subTitle}`,
                                                                            icon: `${tileconfig.icon}` }, 
                                                                           tileType: 'sap.ushell.ui.tile.StaticTile' });

          config.services.ClientSideTargetResolution.adapter.config.inbounds[manifest["sap.app"].id] = tileconfig;
          config.services.ClientSideTargetResolution.adapter.config.inbounds[manifest["sap.app"].id].resolutionResult = {
            "applicationType": "SAPUI5",
            "additionalInformation": component,
            "url": url
          };
        }

      });
    }

    return config;
  }

  addLinkToIndexHtml(service, apiPath: string) {
    const provider = (entity) => {
      if (entity)  return // avoid link on entity level, looks too messy
      return { href:apiPath, name:'Launchpad', title:'Fiori Launchpad' }
    }
    service.$linkProviders ? service.$linkProviders.push(provider) : service.$linkProviders = [provider]
  }
}
