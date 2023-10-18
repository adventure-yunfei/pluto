const fse = require('fs-extra');
const path = require('path');
const express = require('express');
const config = require('../config.json');

const port = config.hosts.demo.by_port;
const dbPath = path.resolve(__dirname, 'db.json');

const app = express();

app.get('/flag', (req, res, next) => {
    try {
        const newValue = req.query.value;
        const db = fse.existsSync(dbPath) ? fse.readJsonSync(dbPath) : {};
        if (newValue) {
            fse.outputJsonSync(dbPath, {
                ...db,
                flag: String(newValue).slice(0, 100),
            }, { spaces: 2 });
        }
        res.send(newValue || db.flag || '');
    } catch (e) {
        res.status(500).send(String(e));
    }
    next();
});

app.listen(port, () => {
    console.log(`listening on port ${port}...`);
});
