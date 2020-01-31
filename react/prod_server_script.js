const process = require('process');
const pm2 = require('pm2');

const ServerScript = 'app/server/index.js';
const ServerPM2Name = 'pluto';

function start_server(done) {
    pm2.connect(err => {
        if (err) {
            console.log('[pm2]', 'start pm2 failed:');
            console.log('[pm2]', err);
            done();
        } else {
            pm2.start({
                script: ServerScript,
                name: ServerPM2Name
            }, () => {
                pm2.disconnect();
                done();
            });
        }
    });
}

function stop_server(done) {
    pm2.connect(err => {
        if (err) {
            console.log('[pm2]', 'start pm2 failed:');
            console.log('[pm2]', err);
            done();
        } else {
            pm2.stop(ServerPM2Name, () => {
                pm2.disconnect();
                done();
            });
        }
    });
}

module.exports = {
    start_server,
    stop_server
};

if (process.env.EXEC_PROD_SERVER) {
    module.exports[process.env.EXEC_PROD_SERVER](function noop() {});
}
