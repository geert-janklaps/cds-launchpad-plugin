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
const cds = __importStar(require("@sap/cds-dk"));
const dot_properties_1 = require("dot-properties");
const LOG = cds.log('cds-launchpad-plugin');
class cds_launchpad_plugin {
    setup(options) {
        options = Object.assign({ basePath: '/$launchpad' }, options);
        const router = express.Router();
        cds.default.on('serving', async (service) => {
            debugger;
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
        let config = fs.readFileSync(__dirname + '/../templates/launchpad.json').toString();
        if (options.version !== '') {
            url = url + '/' + options.version;
        }
        // Read CDS project package
        let packagejson = JSON.parse(fs.readFileSync(cds.default.root + '/package.json').toString());
        // Read manifest files for each UI project that is defined in the project package
        if (Array.isArray(packagejson.sapux)) {
            const apps = new Array();
            packagejson.sapux.forEach(element => {
                let manifest = JSON.parse(fs.readFileSync(cds.default.root + '/' + element + '/webapp/manifest.json').toString());
                let i18n = (0, dot_properties_1.parse)(fs.readFileSync(cds.default.root + '/' + element + '/webapp/i18n/i18n.properties').toString());
                apps.push({ manifest: manifest, i18n: i18n });
            });
            debugger;
        }
        return htmltemplate.replaceAll('LIB_URL', url)
            .replaceAll('THEME', theme)
            .replaceAll('CONFIG', config);
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