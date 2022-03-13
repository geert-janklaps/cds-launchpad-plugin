import {Application} from 'express';
import cds from '@sap/cds';
import {cds_launchpad_plugin} from '../../../' ;

//const cds_launchpad_plugin = require('../../..');

module.exports = cds.server

const bootstrap = ( app: any ): void => {
    const handler = new cds_launchpad_plugin();

    //app.use(handler.setup({theme: 'sap_horizon', version: '1.99.0'}))  
    app.use(handler.setup())    
};

cds.once('bootstrap', bootstrap);