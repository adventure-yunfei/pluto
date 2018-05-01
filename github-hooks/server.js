const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config.json');

const app = express();

app.use(bodyParser.json());

app.use('/github-hooks', function (req, res) {
  console.log('req', req.body);
  res.send('OK');
});

app.listen(config.hosts['github-hooks'].by_port, () => {
  console.log('server started.');
});
