# cds-launchpad-plugin
Launchpad Plugin for demo / development / testing SAP CAP-based projects

## Installation

In your project, run following command:
```sh
npm install --save-dev cds-launchpad-plugin
```

## Usage

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
        app.use(handler.setup({theme:'sap_horizon', version: '1.99.0'}));
    });
}
```

The sandbox launchpad will be served on `/$launchpad`, like http://localhost:4004/$launchpad

## Configuration

Call `setup({...})` method with the following object (configuration object can be omitted):
```jsonc
{
  theme:'sap_horizon', // SAPUI5 Theme
  version: '1.99.0', // SAPUI5 Version
  basePath: '', // Path under which you want the sandbox to be served
  appConfigPath: '', // External sandbox appconfig json file to be merged with generated appconfig
  locale: '' // Language to be used for the sandbox environment
}
```

## External references

Solution overview: https://blogs.sap.com/2022/03/14/a-fiori-launchpad-sandbox-for-all-your-cap-based-projects-overview/

Sample project setup: https://blogs.sap.com/2022/03/14/a-fiori-launchpad-sandbox-for-all-your-cap-based-projects-sample-project-setup/
