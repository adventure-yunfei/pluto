const fse = require('fs-extra');
const _ = require('lodash');

module.exports.replacePlaceholders = function replacePlaceholders(filepath, placeholders) {
    let content = fse.readFileSync(filepath, 'utf8');
    Object.keys(placeholders).forEach(phKey => {
        content = content.replace(phKey, placeholders[phKey]);
    });
    fse.writeFileSync(filepath, content);
}

module.exports.updateJsonFile = function updateJsonFile(filepath, values) {
    const json = fse.readJsonSync(filepath);
    fse.writeJsonSync(filepath, _.merge(json, values), {
        spaces: 2
    });
};
