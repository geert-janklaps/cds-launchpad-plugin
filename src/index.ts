import * as express from 'express';
import * as fs from 'fs';
import * as cds from '@sap/cds-dk';
import { parse, parseLines, stringify } from 'dot-properties';

const LOG = cds.log('cds-launchpad-plugin');
export interface LaunchpadConfig {
  version?: string,
  theme?: string,
  basePath?: string
}

export class cds_launchpad_plugin{
  setup (options: LaunchpadConfig): express.Router{
    options = Object.assign({ basePath:'/$launchpad' }, options)
    const router = express.Router();

    cds.default.on('serving', async (service) => {
      debugger;
      const apiPath = options.basePath;
      const mount = apiPath.replace('$','[\\$]')
      LOG._debug && LOG.debug ('serving launchpad for ', {service: service.name, at: apiPath})

      router.use(mount, async (request: express.Request, response: express.Response, next) => {
        response.send(await this.prepareTemplate(options));
        //next();
      });

      this.addLinkToIndexHtml(service, apiPath)
    });

    return router;
  }

  async prepareTemplate(options: LaunchpadConfig): Promise<string>{
    let url = `https://sapui5.hana.ondemand.com`;
    let theme = options.theme ? options.theme : "sap_fiori_3";

    let htmltemplate = fs.readFileSync(__dirname + '/../templates/launchpad.html').toString();
    let config = fs.readFileSync(__dirname + '/../templates/launchpad.json').toString();

    if(options.version !== ''){
      url = url + '/' + options.version;
    }

    // Read CDS project package
    let packagejson = JSON.parse(fs.readFileSync(cds.default.root + '/package.json').toString());

    // Read manifest files for each UI project that is defined in the project package
    if(Array.isArray(packagejson.sapux)){
      const apps = new Array();

      packagejson.sapux.forEach(element => {
        let manifest = JSON.parse(fs.readFileSync(cds.default.root + '/' + element + '/webapp/manifest.json' ).toString());
        let i18n = parse(fs.readFileSync(cds.default.root + '/' + element + '/webapp/i18n/i18n.properties' ).toString());
        
        apps.push({ manifest: manifest, i18n: i18n});
      });

      debugger;
    }

    return htmltemplate.replaceAll('LIB_URL', url)
                      .replaceAll('THEME', theme)
                      .replaceAll('CONFIG', config);
  }

  addLinkToIndexHtml(service, apiPath: string) {
    const provider = (entity) => {
      if (entity)  return // avoid link on entity level, looks too messy
      return { href:apiPath, name:'Launchpad', title:'Fiori Launchpad' }
    }
    service.$linkProviders ? service.$linkProviders.push(provider) : service.$linkProviders = [provider]
  }
}