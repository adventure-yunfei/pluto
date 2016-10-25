#-*- coding:utf-8 -*-

from django.template import Template, Context
from django.http import HttpResponse, Http404, JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

import json, re, inspect
import plugins.requests as requests

from models import Section, Photography, Entry, Image
from enums import EnumErrorCodes
import models, helper as H, viewsHelper as VH, exceptions as E, version, loginHelper, bosResource, resourcesHelper
from viewsHelper import json_request

####
#### Test Views
####
route = VH.Route()

@route.path(r'^base$')
def base (request):
    return render(request, 'base.html')

@route.path(r'^test$')
def test (request):
    return render(request, 'photo/test.html')

####
#### Main Views
####
@route.path(r'^$')
def index (request):
    displayUsername = VH.getDisplayUsername(request.user)
    sections = Section.objects.filter(username=displayUsername)
    for sec in sections:
        # For each section, append entries belonging to the section
        sec.entries = Entry.objects.filter(username=displayUsername, section_id=sec.id)
        for entry in sec.entries:
            entry.thumbnail_image_src = bosResource.resize_img_fit_to(entry.thumbnail_image_src, 156, 156)
    return VH.render(request, 'photo/home.html', {'sections':sections})

@route.path(r'^about$')
def about (request):
    return VH.render(request, 'about.html', {'version': version.version})

@route.path(r'^photography/([^/]+)$')
def photography (request, photographyTitle):
    photographyTitle = VH.ensureUrlUnquoted(photographyTitle)
    try:
        photography = Photography.objects.get(username=VH.getDisplayUsername(request.user), title=photographyTitle)
    except ObjectDoesNotExist:
        raise Http404
    renderedContent = Template('{% load image %}' + photography.content).render(Context({'user': request.user}))
    return VH.render(request, 'photo/photography.html', {'photographyTitle':photography.title, 'photographyContent':renderedContent})

@route.path(r'^image/([^/]+)$')
def image (request, imageName):
    imageName = VH.ensureUrlUnquoted(imageName)
    try:
        image = Image.objects.get(username=VH.getDisplayUsername(request.user), name=imageName)
    except ObjectDoesNotExist:
        raise Http404
    renderedContent = Template('{% load image %}{% image "' + image.name + '" %}').render(Context({'user': request.user}))
    return VH.render(request, 'photo/photography.html', {'photographyTitle': image.name, 'photographyContent': renderedContent})

@route.path(r'^edit$')
@login_required(redirect_field_name='originURL')
def edit (request):
    return VH.render(request, 'photo/edit.html')

@route.path(r'^save$')
@login_required(redirect_field_name='originURL')
@require_POST
@transaction.atomic
def save (request):
    '''Temp page to Save photography into db and redirect to the new created photography page.'''
    '''@redirect Photography page that shows previous saved photography.'''
    photographyInfo = request.POST
    if photographyInfo['title'] and photographyInfo['content']:     # Ensure both title and content are not empty.
        photography = Photography(username=request.user.username, title=photographyInfo['title'], content=photographyInfo['content'])
        photography.save()
        return redirect('/photography/'+photography.title, permanent=False)
    else:
        raise E.DataException('save: Both photography type and content cannot be empty!')

@route.path(r'^login$')
@require_http_methods(['GET','POST'])
def login (request):
    params = request.REQUEST
    username = params.get('username')
    returnJson = params.get('json') == 'true'
    if username is not None:
        ip = VH.getClientIP(request)
        loginHelper.preLogin(ip)
        user = auth.authenticate(username=params.get('username'), password=params.get('password'))
        if user is not None:
            auth.login(request, user)
            loginHelper.postLogin(ip)
            if returnJson:
                return JsonResponse({})
            elif 'originURL' in params:
                return redirect(params.get('originURL'), permanent=False)
            else:
                return redirect('/', permanent=False)
    if returnJson:
        return JsonResponse({'e': EnumErrorCodes.WrongAccountOrPassword}, status=400)
    else:
        return VH.render(request, 'photo/login.html')

@route.path(r'^get_user$')
@require_http_methods(['GET','POST'])
@json_request()
def get_user (data, request):
    return {'username': request.user.username}

@route.path(r'^logout$')
@require_http_methods(['GET','POST'])
def logout (request):
    auth.logout(request)
    params = request.REQUEST
    returnJson = params.get('json') == 'true'
    if returnJson:
        return JsonResponse({})
    elif 'originURL' in params:
        return redirect(params.get('originURL'), permanent=False)
    else:
        return redirect('/', permanent=False)

@route.path(r'^clear$')
@login_required(redirect_field_name='originURL')
@require_http_methods(['GET', 'POST'])
@transaction.atomic
def clear (request):
    '''Clear all data in database and BAE bucket for specified users.'''
    '''@request confirm: Required to avoid mistake operation'''
    '''@request usernames: Required. The user names whose data will be cleared. Separated by comma'''
    params = request.REQUEST
    if not VH.isAdminUser(request.user.username):
        raise E.PermissionException('clear: This action can only be performed by admin user.')
    elif 'confirm' not in params or params.get('usernames') is None:
        raise E.RequestParamException('clear: Required parameter "confirm" or "usernames" is missing.')
    return HttpResponse(('Clear successful.\n\n BAE Delete Log: \n' + VH.clear(params.getlist('usernames'))).replace('\n','<br/>'))


####
#### Views that may embeded in previous page
#### These pages are request by AJAX, so json data is directly send as string, not wrapped in form.
####
@route.path(r'^getTemplates$')
@login_required(redirect_field_name='originURL')
@require_POST
def getTemplates (request):
    '''Get specified html template.'''
    '''@receive JSON as [<templatePath>] '''
    '''@return JSON [<templateHtml>], same order with input paths'''
    templateNames = json.loads(request.body)
    result = []
    for name in templateNames:
        result.append(VH.renderTemplate(request, name))

    return HttpResponse(json.dumps(result))

@route.path(r'^editEntries$')
@login_required(redirect_field_name='originURL')
@require_POST
def editEntries (request):
    '''Edit Entries interface.'''
    '''@receive JSON as {"sectionId": ID}.'''
    '''@return Edit Entries interface html.'''
    #sectionId = json.loads(request.body)['sectionId']
    #entries = Entry.objects.filter(username=request.user.username, section_id=sectionId)
    return render(request, 'photo/embeddedPages/editEntries_frame.html')

@route.path(r'^uploadImage$')
@login_required(redirect_field_name='originURL')
@require_POST
@transaction.atomic
def uploadImage (request):
    '''Upload image to BAE cloud storage.'''
    '''@receive Form data with keys "allowOverwrite"(boolean), "images"(files in request.FILES).'''
    '''@return JSON indicating saved images, format [{'name':filename, 'path':imageSavePath}].'''
    methodName = 'uploadImage'
    username = request.user.username
    allowOverwrite = request.POST.get('allowOverwrite')
    savedImgs = []

    for img in request.FILES.getlist('images'):
        imgSavePath = resourcesHelper.getFileSavePath(username, img.name)
        imgSaveName = img.name[:img.name.rfind('.')]

        if bosResource.upload_by_str(imgSavePath, img.read()):     # Upload file succeeds. Save record to database.
            imgInfo = {'name':imgSaveName, 'path':imgSavePath}
            savedImgs.append(imgInfo)
            existedImages = Image.objects.filter(username=username, name=imgSaveName)
            if len(existedImages) == 0:     # New Record.
                Image(username=username, name=imgSaveName, src=imgSavePath).save()
            elif allowOverwrite is not None:    # Update existing record. There will be only one record as unique_together Meta setting.\
                existedImage = existedImages[0]
                existedImage.src = imgSavePath
                existedImage.save()
                imgInfo['overwrite'] = True
            else:
                raise E.RequestParamException('%s: Attempt to overwrite existed image with name (%s) while not allow to overwrite.' % (methodName, imgSaveName))
        else:
            raise E.BAEException('%s: Saving image to BAE bucket failed. Image name:%s. Error info: %s' % (methodName, img.name, response))

    return HttpResponse(json.dumps(savedImgs))
