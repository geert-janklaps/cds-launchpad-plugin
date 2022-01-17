import * as express from 'express';
 

const cds_launchpad = require('../');
const app = express();
 
app.get('/', (request, response) => {
  response.send('Hello world!');
});

app.use(cds_launchpad({version: '1.97.0', theme: 'sap_horizon'}));

app.listen(5000);