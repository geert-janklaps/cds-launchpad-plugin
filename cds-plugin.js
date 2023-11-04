
const cds = require('@sap/cds')
const {cds_launchpad_plugin} = require('./dist/index')

cds.once('bootstrap', app => {
    const handler = new cds_launchpad_plugin();
    app.use(handler.setup());
});