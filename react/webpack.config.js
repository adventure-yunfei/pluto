const makeWebpackConfig = require('./makeWebpackConfig').default;

const isDev = process.env.IS_DEV === 'true';
const isTest = process.env.IS_TESTING === 'true';

module.exports = makeWebpackConfig(isDev, isTest);
