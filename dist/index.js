"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
//import * as cds from '@sap/cds-dk';
const dot_properties_1 = require("dot-properties");
const cds = require('@sap/cds-dk');
const LOG = cds.log('cds-launchpad-plugin');
class cds_launchpad_plugin {
    setup(options) {
        options = options !== undefined ? options : {};
        options = options.basePath !== undefined ? options : Object.assign({ basePath: '/$launchpad' }, options);
        const router = express.Router();
        cds.on('serving', async (service) => {
            const apiPath = options.basePath;
            const mount = apiPath.replace('$', '[\\$]');
            LOG._debug && LOG.debug('serving launchpad for ', { service: service.name, at: apiPath });
            router.use(mount, async (request, response, next) => {
                response.send(await this.prepareTemplate(options));
                //next();
            });
            this.addLinkToIndexHtml(service, apiPath);
        });
        return router;
    }
    async prepareTemplate(options) {
        let url = `https://sapui5.hana.ondemand.com`;
        let theme = options.theme ? options.theme : "sap_fiori_3";
        let htmltemplate = fs.readFileSync(__dirname + '/../templates/launchpad.html').toString();
        let config = JSON.parse(fs.readFileSync(__dirname + '/../templates/launchpad.json').toString());
        if (options.version !== undefined && options.version !== '') {
            url = url + '/' + options.version;
        }
        // Read CDS project package
        let packagejson = JSON.parse(fs.readFileSync(cds.root + '/package.json').toString());
        // Read manifest files for each UI project that is defined in the project package
        if (Array.isArray(packagejson.sapux)) {
            let applications = {};
            packagejson.sapux.forEach(element => {
                let manifest = JSON.parse(fs.readFileSync(cds.root + '/' + element + '/webapp/manifest.json').toString());
                let i18n = (0, dot_properties_1.parse)(fs.readFileSync(cds.root + '/' + element + '/webapp/' + manifest["sap.app"].i18n).toString());
                let tileconfig = manifest["sap.app"].crossNavigation.inbounds[Object.keys(manifest["sap.app"].crossNavigation.inbounds)[0]];
                // Replace potential string templates used for tile title and description (take descriptions from default i18n file)
                Object.keys(tileconfig).forEach(key => {
                    if (key === 'title' || key === 'subTitle') {
                        tileconfig[key] = tileconfig[key].toString().replace(`{{`, ``).replace(`}}`, ``);
                        if (i18n[tileconfig[key].toString()] !== undefined) {
                            tileconfig[key] = `${i18n[tileconfig[key].toString()]}`;
                        }
                    }
                });
                // App URL
                let url = element.replace(cds.env.folders.app, '');
                // App tile template
                let tile = `{ "${manifest["sap.app"].id}" : {
            "title": "${tileconfig.title}",
            "description": "${tileconfig.subTitle}",
            "icon": "${tileconfig.icon}",
            "additionalInformation": "SAPUI5.Component=${manifest["sap.app"].id}",
            "applicationType": "URL",
            "url": "./${url}",
            "navigationMode": "embedded"
        } }`;
                // Add app title to application object
                Object.assign(applications, JSON.parse(tile));
            });
            // Update applications in launchpad configuration
            config.applications = Object.assign(config.applications, applications);
        }
        return htmltemplate.replaceAll('LIB_URL', url)
            .replaceAll('THEME', theme)
            .replaceAll('CONFIG', JSON.stringify(config));
    }
    addLinkToIndexHtml(service, apiPath) {
        const provider = (entity) => {
            if (entity)
                return; // avoid link on entity level, looks too messy
            return { href: apiPath, name: 'Launchpad', title: 'Fiori Launchpad' };
        };
        service.$linkProviders ? service.$linkProviders.push(provider) : service.$linkProviders = [provider];
    }
}
exports.cds_launchpad_plugin = cds_launchpad_plugin;
//# sourceMappingURL=index.js.map