#-*- coding:utf-8 -*-
from django.shortcuts  import  render as django_render
from django.utils import http
from django.template import loader, RequestContext
from django.db import transaction as django_transaction
from django.http import JsonResponse
from django.utils.decorators import available_attrs
from django.conf.urls import url

from functools import wraps
import json

from photo import helper as H, models as M, modelsHelper as MH, exceptions as E, bosResource, resourcesHelper, globalConfig
from photo.enums import EnumErrorCodes

adminUsername = 'adventure'

def getAdjustedContextProperties (request, contextProps=None):
    '''Based on existing context, set some common properties.'''
    if contextProps is None:
        contextProps = {}
    # Set whether has user logged in, to determine whether to show content such as editing.
    contextProps['admin'] = request.user.is_authenticated()
    contextProps['username'] = request.user.username
    contextProps['hosts'] = globalConfig.config['hosts']
    return contextProps

def render (request, templateFile, properties=None, *args, **keywordargs):
    '''Wrap render func to pass some common properties.'''
    return django_render (request, templateFile, getAdjustedContextProperties(request, properties), *args, **keywordargs)

def renderTemplate(request, templateFile, properties=None):
    return loader.get_template(templateFile).render(RequestContext(request, getAdjustedContextProperties(request, properties)))

def getDisplayUsername (requestUser):
    '''Get username whose data should display for current user in requset.'''
    '''Normally, if no user logged in, should data for admin user. Otherwise should user\'s own data.'''
    '''@param requestUser: user in http request.'''
    return H.TIF(requestUser.is_authenticated(), requestUser.username, adminUsername)

def str_rreplace (string, old, new, count):
    '''Replace in string, but reversely replace first count occurrences in right.'''
    li = string.rsplit(old, count)
    return new.join(li)


def isAdminUser (username):
    '''Check whether user is admin user.'''
    return username == adminUsername

def getClientIP (request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[-1].strip()
    else:
        return request.META.get('REMOTE_ADDR')

def ensureUrlUnquoted (str):
    '''Ensure the str is url unquoted.'''
    '''Current case is that BAE canot handle chinese url, so chinese there is quoted.'''
    '''@return Unicode unquoted string.'''
    return http.urlunquote(str)

def clear (usernames):
    '''Clear all data for specified users (inside DB and BAE Image Bucket)'''
    '''@param usernames Array of string'''
    # Clear database.
    for model in H.getModuleClasses(M):
        model.objects.filter(username__in=usernames).delete()

    # Clear BAE bucket.
    baeDeleteLog = ''
    for username in usernames:
        if isAdminUser(username):
            rootFolderName = resourcesHelper.adminFolder
        else:
            rootFolderName = username
        baeDeleteLog += map(lambda path: 'Delete %s \n' % path, bosResource.delete('/' + rootFolderName + '/'))
    return baeDeleteLog


def json_request (loginRequired = True, receiveJson = True, transaction = False):
    '''
    decorator, 封装view函数以接收及返回json对象
    示例:
        @json_request()
        def get_user(data, request):
            return {
                'username': 'guest'
            }
    注意：json_request 会截获 JsonRequestException，不可在其后使用 @transaction.atomic，而应当传入 transaction=True 参数
    '''
    def __decorator (viewFunc):
        @wraps(viewFunc, assigned=available_attrs(viewFunc)) ## 拷贝原函数属性
        def __wrapper (request, *args):
            if loginRequired and not request.user.is_authenticated():
                return JsonResponse({'e': EnumErrorCodes.NotLogin})

            data = None
            if request.body and receiveJson:
                data = json.loads(request.body)
            try:
                if transaction:
                    with django_transaction.atomic():
                        resultData = viewFunc (data, request, *args)
                else:
                    resultData = viewFunc (data, request, *args)
            except E.JsonRequestException as e:
                return JsonResponse(e.data, safe=False, status=400)

            return JsonResponse(resultData, safe=False)
        return __wrapper

    return __decorator

class Route:
    '''
    定义路由
    注意：decorator必须放在最顶上
    示例:
    - views.py:
        route = Route()

        @route.path(r'^/hello/(.*)$')
        @... ## 其他decorator
        def hello_view (request, name):
            return 'hello ' + name
    - urls.py:
        urlpatterns = views.route.urls
    '''
    def __init__(self):
        self.urls = []

    def path (self, uriPath):
        def __decorator (viewFunc):
            self.urls.append(url(uriPath, viewFunc))
            return viewFunc
        return __decorator
