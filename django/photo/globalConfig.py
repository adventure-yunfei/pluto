import json

import os.path as path

globalConfigJsonFile = open(path.abspath(path.join(path.dirname(__file__), '..', '..', 'config.json')), 'r')

config = json.load(globalConfigJsonFile)

globalConfigJsonFile.close()
