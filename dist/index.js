"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
module.exports =
    function (options) {
        return function (request, response, next) {
            console.log(`${request.method} ${request.path}`);
            console.log(options);
            if (request.path === '/launchpad.html') {
                //response.send(htmlTplString);
                response.send(prepareTemplate(options));
            }
            else if (request.path !== '/appconfig/fioriSandboxConfig.json'
                && request.path !== '/sap/opu/odata/sap/ESH_SEARCH_SRV/ServerInfos'
                && request.path !== '/sap/es/ina/GetServerInfo') {
                next();
            }
        };
    };
function prepareTemplate(options) {
    let url = `https://sapui5.hana.ondemand.com`;
    let theme = options.theme ? options.theme : "sap_fiori_3";
    let htmltemplate = fs.readFileSync(__dirname + '/../templates/launchpad.html').toString();
    let config = fs.readFileSync(__dirname + '/../templates/launchpad.json').toString();
    if (options.version !== '') {
        url = url + '/' + options.version;
    }
    return htmltemplate.replaceAll('LIB_URL', url)
        .replaceAll('THEME', theme)
        .replaceAll('CONFIG', config);
}
//# sourceMappingURL=index.js.map