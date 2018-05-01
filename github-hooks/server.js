const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const log4js = require('log4js');
const config = require('../config.json');

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

log4js.configure({
  appenders: {
    all: { type: 'file', filename: path.resolve(__dirname, 'hooks.log') }
  },
  categories: {
    default: { appenders: ['all'], level: 'debug' }
  }
});
const logger = log4js.getLogger();

const app = express();

app.use(bodyParser.json());

app.use('/github-hooks', function (req, res) {
  const eventName = req.header('X-GitHub-Event');
  try {
    runHook(eventName, req.body);
  } catch (e) {
    log4js.error(e && e.toString());
    res.send(500, 'Failed');
    return;
  }
  res.send('OK');
});

app.listen(config.hosts['github-hooks'].by_port, () => {
  console.log('server started.');
});
