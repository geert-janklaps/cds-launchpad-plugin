# cds-launchpad-plugin
Launchpad Plugin for demo / development / testing SAP Cloud Application Programming Model-based projects

## Installation

In your project, run following command:
```sh
npm install --save-dev cds-launchpad-plugin
```

## Usage

### SAP Cloud Application Programming (CAP) Model 6.7.0 or higher

The cds-launchpad-plugin is using the SAP Cloud Application Programming Model plugin technique. 
Installing the plugin as a dev dependency (see installation) is sufficient to enable the plugin automatically.

#### Configuration

Optionally you can configure the cds-launchpad-plugin by adding following configuration to your package.json file.

```jsonc
"cds": {
  "launchpad": {
    "theme":"sap_horizon", // SAPUI5 Theme
    "version": "1.120.1", // SAPUI5 Version
    "basePath": "", // Path under which you want the sandbox to be served
    "appConfigPath": "", // External sandbox appconfig json file to be merged with generated appconfig
    "locale": "", // Language to be used for the sandbox environment
    "template": "" ,// 'legacy' (non-async launchpad, default) or 'async' (async launchpad),
    "modulePaths": "" // object with module paths to be used in the launchpad.html file for "sap-ushell-config"
  }
}
```

The sandbox launchpad will be served on `/$launchpad`, like http://localhost:4004/$launchpad

### SAP Cloud Application Programming (CAP) Model 6.7.0 or lower

Have this in your [`server.js`](https://cap.cloud.sap/docs/node.js/cds-server#custom-server-js):

```js
const cds = require ('@sap/cds');

/* For releases before cds 7:
replace:
cds.env.production === false
with:
process.env.NODE_ENV !== 'production'
*/
if (cds.env.production === false){
    const {cds_launchpad_plugin} = require('cds-launchpad-plugin');

    // Enable launchpad plugin
    cds.once('bootstrap',(app)=>{
        const handler = new cds_launchpad_plugin();
        app.use(handler.setup({theme:'sap_horizon', version: '1.120.1'}));
    });
}
```

The sandbox launchpad will be served on `/$launchpad`, like http://localhost:4004/$launchpad

#### Configuration

Call `setup({...})` method with the following object (configuration object can be omitted):
```jsonc
{
  theme:'sap_horizon', // SAPUI5 Theme
  version: '1.99.0', // SAPUI5 Version
  basePath: '', // Path under which you want the sandbox to be served
  appConfigPath: '', // External sandbox appconfig json file to be merged with generated appconfig
  locale: '', // Language to be used for the sandbox environment
  template: '', // 'legacy' (non-async launchpad) or 'async' (async launchpad)
  modulePaths: '' // object with module paths to be used in the launchpad.html file for "sap-ushell-config"
}
```

## External references

Solution overview: https://blogs.sap.com/2022/03/14/a-fiori-launchpad-sandbox-for-all-your-cap-based-projects-overview/

Sample project setup: https://blogs.sap.com/2022/03/14/a-fiori-launchpad-sandbox-for-all-your-cap-based-projects-sample-project-setup/

## Development

### Prerequisites
- node 18
- pnpm

### Setup
```sh
git clone https://github.com/geert-janklaps/cds-launchpad-plugin
cd cds-launchpad-plugin
pnpm install
pnpm watch
# run cds server
pnpm dev:sapux
# go to http://localhost:4004/$launchpad
```
