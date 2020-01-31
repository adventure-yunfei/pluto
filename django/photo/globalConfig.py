import json

import os.path as path

def _readJsonFile (filepath):
    jsonFile = open(filepath, 'r')
    content = json.load(jsonFile)
    jsonFile.close()
    return content

config = _readJsonFile(path.abspath(path.join(path.dirname(__file__), '..', '..', 'config.json')))

deployConfig = _readJsonFile(path.abspath(path.join(path.dirname(__file__), '..', 'deploy.config.json')))
