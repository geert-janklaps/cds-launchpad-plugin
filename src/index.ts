import * as express from 'express';
import * as fs from 'fs';
import * as cds from '@sap/cds-dk';

export interface LaunchpadConfig {
  version?: string,
  theme?: string
}

module.exports = 
function (options: LaunchpadConfig) {
  const router = express.Router();

  return function (request: express.Request, response: express.Response, next) {
    console.log(`${request.method} ${request.path}`);
    console.log(options);

    if(request.path === '/launchpad'){
      response.send(prepareTemplate(options));
    }
    else if(request.path !== '/appconfig/fioriSandboxConfig.json' 
            && request.path !== '/sap/opu/odata/sap/ESH_SEARCH_SRV/ServerInfos'
            && request.path !== '/sap/es/ina/GetServerInfo') {
        next();
    }
  }
}

function prepareTemplate(options: LaunchpadConfig){
  let url = `https://sapui5.hana.ondemand.com`;
  let theme = options.theme ? options.theme : "sap_fiori_3";

  let htmltemplate = fs.readFileSync(__dirname + '/../templates/launchpad.html').toString();
  let config = fs.readFileSync(__dirname + '/../templates/launchpad.json').toString();

  if(options.version !== ''){
    url = url + '/' + options.version;
  }

  return htmltemplate.replaceAll('LIB_URL', url)
                     .replaceAll('THEME', theme)
                     .replaceAll('CONFIG', config);
}