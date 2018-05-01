const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config.json');
const logger = require('./logger');

const HookDir = path.resolve(__dirname, 'hooks');

function runHook(eventName, eventPayload) {
  const hookNames = fs.readdirSync(HookDir);
  const jsFileName = `${eventName || ''}.js`;
  if (hookNames.indexOf(jsFileName) !== -1) {
    const tgtHook = require(path.resolve(HookDir, jsFileName));
    if (tgtHook) {
      tgtHook(eventPayload);
    }
  }
}

const app = express();

app.use(bodyParser.json());

app.use('/github-hooks', function (req, res) {
  const eventName = req.header('X-GitHub-Event');
  try {
    runHook(eventName, req.body);
  } catch (e) {
    logger.error(e && e.toString());
    res.send(500, 'Failed');
    return;
  }
  res.send('OK');
});

app.listen(config.hosts['github-hooks'].by_port, '127.0.0.1', () => {
  console.log('server started.');
});
