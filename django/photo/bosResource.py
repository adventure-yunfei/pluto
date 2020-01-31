#coding=utf-8
# 此文件所有暴露于外部的方法均为文件管理的通用接口
# 不要在此添加特定于某一个文件管理工具的处理方法，以便可以在必要时更换工具
# -------- 接口定义规范 ---------------------------------
# 	* 所有路径为相对于根目录的路径，以'/'开头和分割
#	* 路径以'/'结尾为文件夹，否则为文件
#	* 路径(无论输入或输出)字符串均以utf-8编码
import json
import os.path as path
from baidubce.bce_client_configuration import BceClientConfiguration
from baidubce.auth.bce_credentials import BceCredentials
# from baidubce import exception
# from baidubce.services import bos
# from baidubce.services.bos import canned_acl
from baidubce.services.bos.bos_client import BosClient
from django.utils import http
import exceptions as E, helper as H
from photo.globalConfig import deployConfig

# 配置BOS变量及BOS Client
_bucket = 'adventure030-image'
_bos_host = "http://bj.baidubos.com/"
_access_key = deployConfig['baidu-access-key']
_secret_access_key = deployConfig['baidu-secret-key']

H.ensure(_access_key != '' and _secret_access_key != '', E.AssertFailed, '百度 Access Key 未提供.')

_bos_config = BceClientConfiguration(credentials=BceCredentials(_access_key, _secret_access_key), endpoint = _bos_host)
_bos_client = BosClient(_bos_config)

_ensure_path = lambda path: H.ensure(path.startswith('/'), E.AssertFailed, '路径必须以"/"开头.') or True
_ensure_folder_path = lambda folderPath: _ensure_path(folderPath) and H.ensure(folderPath.endswith('/'), E.AssertFailed, '文件夹路径必须以"/"结尾.')
_ensure_file_path = lambda filePath: _ensure_path(filePath) and H.ensure(not filePath.endswith('/'), E.AssertFailed, '文件路径不能"/"结尾.')

PREFIX = 'http://adventure030-image.bceimg.com'

ensure_file_path = _ensure_file_path

def _is_folder(path):
	_ensure_path(path)
	return path.endswith('/')

def get_url(filePath):
	'''获取指定路径文件的访问URL'''
	'''@param path <string> 文件相对路径'''
	'''@return <string> 访问文件的URL链接'''
	_ensure_file_path(filePath)
	return PREFIX + filePath

def get_img_url(filePath):
	return get_url(filePath) + '@f_jpg'

def resize_img_by_max_size(imgPath, maxWidth = None, maxHeight = None):
    return get_url(imgPath) + '@s_0' + H.TIF(maxWidth != None, ',w_' + str(maxWidth), '') + H.TIF(maxHeight != None, ',h_' + str(maxHeight), '')

def resize_img_fit_to(imgPath, fitWidth, fitHeight):
	return get_url(imgPath) + '@s_2' + ',w_' + str(fitWidth) + ',h_' + str(fitHeight)

def get_file_as_string(filePath):
	'''以字符串输出形式读取文件'''
	_ensure_file_path(filePath)
	return _bos_client.get_object_as_string(_bucket, filePath[1:])

def upload_by_file(remotePath, localPath):
	'''从本地文件中上传文件/文件夹'''
	'''@param remotePath <string> 上传文件的目标路径'''
	'''@param localPath <string> 所上传的源文件的本地路径'''
	'''注: 本地和远程路径类型(文件/文件夹)需保持一致, 文件夹以'/'结尾'''
	# 检查路径类型是否一致
	_ensure_path(remotePath)
	_ensure_path(localPath)
	isFolder = _is_folder(remotePath)
	if not ((isFolder and _is_folder(localPath)) or (not isFolder and not _is_folder(localPath))):
		return False

	if isFolder:
		pass
	else:
		_bos_client.put_object_from_file(_bucket, remotePath[1:], localPath)
	return True

def upload_by_str(filePath, data_str):
	'''从数据流中上传文件'''
	'''@param path <string> 上传文件的目标路径'''
	'''@param data_str <string> 所上传的内容'''
	_ensure_file_path(filePath)
	_bos_client.put_object_from_string(_bucket, filePath[1:], data_str)
	return True

def list_files(folderPath):
	'''获取指定文件夹下的文所有件/文件夹路径列表'''
	'''@param folderPath <string> 指定文件夹'''
	'''@param recursive <bool> 是否递归列出所有子目录下的文件'''
	_ensure_folder_path(folderPath)
	objects = _bos_client.list_all_objects(_bucket)
	return filter(
		lambda key: key.startswith(folderPath),
		map(lambda obj: '/' + H.toUTF8(obj.key), objects)
		)

def delete(path):
	'''删除文件/文件夹'''
	'''@param path <string> 文件/文件夹路径'''
	'''@return Array.<string> 删除的文件路径列表'''
	_ensure_path(path)
	if not _is_folder(path):
		_bos_client.delete_object(_bucket, path[1:])
		return [path]
	else:
		deletedPaths = []
		paths = list_files(path)
		for p in paths:
			if not _is_folder(p):
				deletedPaths += delete(p)
		return deletedPaths
