#coding=utf-8
from PIL import Image as PILImage
import StringIO

import helper as H
import exceptions as E
import viewsHelper as VH
import bosResource

adminFolder = 'main'    # Root folder that holds images for admin user.

def getFileSavePath (username, imgFileName):
    '''Get image saved path inside resources'''
    return H.toUTF8('/' + H.TIF(username==VH.adminUsername, adminFolder, username) +'/' + imgFileName)
