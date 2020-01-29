const fs = require('fs');

module.exports.replacePlaceholders = function replacePlaceholders(filepath, placeholders) {
    let content = fs.readFileSync(filepath, 'utf8');
    Object.keys(placeholders).forEach(phKey => {
        content = content.replace(phKey, placeholders[phKey]);
    });
    fs.writeFileSync(filepath, content);
}
