"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cds_launchpad_plugin = void 0;
const express = __importStar(require("express"));
const fs = __importStar(require("fs"));
const fsAsync = __importStar(require("fs/promises"));
const appindex = __importStar(require("@sap/cds/app/index"));
//import * as cds from '@sap/cds-dk';
const dot_properties_1 = require("dot-properties");
const cds = require('@sap/cds-dk');
const cdsLaunchpadLogger = cds.log('cds-launchpad-plugin');
class cds_launchpad_plugin {
    setup() {
        if (process.env.NODE_ENV === 'production') {
            cdsLaunchpadLogger.debug('Sandbox launchpad not initialized as the process runs in production ');
            return;
        }
        let options = cds.env.launchpad;
        const router = express.Router();
        cds.on('serving', async (service) => {
            const apiPath = options.basePath;
            const mount = apiPath.replace('$', '[\\$]');
            cdsLaunchpadLogger._debug && cdsLaunchpadLogger.debug('serving launchpad for ', { service: service.name, at: apiPath });
            router.use(mount, async (request, response, next) => {
                response.send(await this.prepareTemplate(options));
                //next();
            });
            router.use('/appconfig/fioriSandboxConfig.json', async (request, response, next) => {
                // debugger;
                response.send(await this.prepareAppConfigJSON(options));
            });
            const componentPreloadCache = new Map();
            const _componentPreload = async (appName) => {
                if (componentPreloadCache.get(appName))
                    return componentPreloadCache.get(appName);
                const [manifest, component] = await Promise.all([
                    fsAsync.readFile(cds.root + cds.env.folders.app + appName + '/webapp/manifest.json'),
                    fsAsync.readFile(cds.root + cds.env.folders.app + appName + '/webapp/Component.js')
                ]);
                const componentPreload = `//@ui5-bundle preview/Component-preload.js
        jQuery.sap.registerPreloadedModules({
        "version":"2.0",
        "modules":{
          "preview/Component.js": function(){${component.toString()}
        },
          "preview/manifest.json":${manifest.toString()}
        }});`;
                componentPreloadCache.set(appName, componentPreload);
                return componentPreload;
            };
            router.get('/:app/webapp/Component-preload.js', async ({ params }, resp) => resp.send(await _componentPreload(params.app)));
        });
        router.get('/', (req, res, next) => {
            const html = appindex.html.replace(/<h2> Web Applications: <\/h2>/, `<h2><b><a href="${options.basePath}">Sandbox Launchpad</a></b></h2><h2>Web Applications: </h2>`);
            res.send(html);
        });
        return router;
    }
    async prepareTemplate(options) {
        let url = `https://sapui5.hana.ondemand.com`;
        const htmltemplate = fs.readFileSync(__dirname + '/../templates/launchpad.html').toString();
        if (options.version && options.version.startsWith('https://')) {
            url = options.version;
        }
        else if (options.version !== undefined && options.version !== '') {
            url = url + '/' + options.version;
        }
        return htmltemplate.replace(/LIB_URL/g, url)
            .replace(/THEME/g, options.theme);
    }
    async prepareAppConfigJSON(options) {
        // Read app config template
        const config = JSON.parse(fs.readFileSync(__dirname + '/../templates/appconfig.json').toString());
        // Read externally provided config 
        const extConfig = options.appConfigPath ? JSON.parse(fs.readFileSync(options.appConfigPath).toString()) : {};
        // merge the two
        Object.assign(config, extConfig);
        // Read CDS project package
        const packagejson = JSON.parse(fs.readFileSync(cds.root + '/package.json').toString());
        // Read manifest files for each UI project that is defined in the project package
        if (Array.isArray(packagejson.sapux)) {
            const applications = {};
            packagejson.sapux.forEach(element => {
                const manifest = JSON.parse(fs.readFileSync(cds.root + cds.env.folders.app + element.replace(cds.env.folders.app, '') + '/webapp/manifest.json').toString());
                const appId = manifest["sap.app"].id;
                if (manifest["sap.flp"]?.type === 'plugin') {
                    const component = appId;
                    const name = component.split('.').pop();
                    config.bootstrapPlugins[name] = {
                        component,
                        url: name + "/webapp",
                        'sap-ushell-plugin-type': 'RendererExtensions',
                        enabled: true
                    };
                    return;
                }
                let i18nsetting = manifest["sap.app"].i18n;
                let i18nPath = cds.root + cds.env.folders.app + element.replace(cds.env.folders.app, '') + '/webapp/';
                if (typeof (i18nsetting) === "object") {
                    if (manifest._version < "1.21.0") {
                        cdsLaunchpadLogger.error(`manifest.json version of ${element} does not allow i18n being an object. Minumum version 1.21.0.`);
                    }
                    i18nPath += i18nsetting.bundleUrl;
                }
                else {
                    i18nPath += i18nsetting;
                }
                if (options.locale) {
                    i18nPath = i18nPath.replace(/(\.properties)$/, `_${options.locale}$1`);
                }
                const i18n = (0, dot_properties_1.parse)(fs.readFileSync(i18nPath).toString());
                const tileconfigs = manifest["sap.app"]?.crossNavigation?.inbounds;
                for (const tileconfigId in tileconfigs) {
                    const tileconfig = tileconfigs[tileconfigId];
                    const tileId = `${appId}-${tileconfigId}`;
                    // Replace potential string templates used for tile title and description (take descriptions from default i18n file)
                    Object.keys(tileconfig).forEach(key => {
                        if (['title', 'subTitle', 'info'].includes(key)) {
                            const strippedValue = tileconfig[key].toString().replace(`{{`, ``).replace(`}}`, ``);
                            if (i18n[strippedValue] !== undefined) {
                                tileconfig[key] = i18n[strippedValue];
                            }
                        }
                    });
                    // App URL
                    const url = `/${element.replace(cds.env.folders.app, '')}/webapp`;
                    const component = `SAPUI5.Component=${appId}`;
                    // App tile template
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
                        } : {}),
                        tileType: tileconfig.indicatorDataSource ? 'sap.ushell.ui.tile.DynamicTile' : 'sap.ushell.ui.tile.StaticTile',
                        serviceRefreshInterval: (tileconfig.indicatorDataSource && tileconfig.indicatorDataSource.refresh || 10) // defautl 10 sec
                            // multiplying by a large number basically means "never refresh" - this can stay this way as long as
                            // its not supported by the local adapter, see sap.ushell.adapters.local.LaunchPageAdapter, private function handleTileServiceCall,
                            // which does the service calls correctly and regularly, but doesnt update the tiles
                            * 1000
                    });
                    config.services.ClientSideTargetResolution.adapter.config.inbounds[tileId] = tileconfig;
                    config.services.ClientSideTargetResolution.adapter.config.inbounds[tileId].resolutionResult = {
                        "applicationType": "SAPUI5",
                        "additionalInformation": component,
                        "url": url
                    };
                }
            });
        }
        return config;
    }
}
exports.cds_launchpad_plugin = cds_launchpad_plugin;
//# sourceMappingURL=index.js.map