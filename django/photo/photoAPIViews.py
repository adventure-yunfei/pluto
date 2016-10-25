#-*- coding:utf-8 -*-
from django.template import Template, Context
from django.views.decorators.http import require_POST
from django.core.exceptions import ObjectDoesNotExist

from photo import bosResource, resourcesHelper, helper as H, viewsHelper as VH, modelsHelper as MH, exceptions as E, bosResource
from models import Section, Photography, Entry, Image
from enums import EnumErrorCodes
json_request = VH.json_request

route = VH.Route()

@route.path(r'^get_sections$')
@json_request(False)
def get_sections (data, request):
    displayUsername = VH.getDisplayUsername(request.user)
    sections = MH.jsonize(Section.objects.filter(username=displayUsername))
    for sec in sections:
        # For each section, append entries belonging to the section
        sec['entries'] = MH.jsonize(Entry.objects.filter(username=displayUsername, section_id=sec['id']))
    return {'sections': sections}

@route.path(r'^photography/([^/]+)/edit$')
@route.path(r'^photography/([^/]+)$')
@json_request(False)
def photography (data, request, photographyTitle):
    photographyTitle = VH.ensureUrlUnquoted(photographyTitle)
    try:
        photography = MH.jsonize(Photography.objects.get(username=VH.getDisplayUsername(request.user), title=photographyTitle))
        photography['content'] = Template('{% load image %}' + photography['content']).render(Context({'user': request.user}))
        return photography
    except ObjectDoesNotExist:
        raise E.JsonRequestException(EnumErrorCodes.NotFound)

@route.path(r'^save$')
@require_POST
@json_request(transaction=True)
def save (data, request):
    if data.get('title') and data.get('content'):   # Ensure both title and content are not empty.
        if data.get('id'):
            try:
                photography = Photography.objects.get(id=data['id'])
                photography.title = data['title']
                photography.content = data['content']
            except ObjectDoesNotExist:
                raise E.JsonRequestException(EnumErrorCodes.NotFound)
        else:
            photography = Photography(username=request.user.username, title=data['title'], content=data['content'])
        photography.save()
        return {}
    else:
        raise E.JsonRequestException(EnumErrorCodes.InvalidParam)

@route.path(r'^apply_section_and_entry_changes$')
@require_POST
@json_request(transaction=True)
def apply_section_and_entry_changes (data, request):
    '''Handle changes (insert, update, remove) for both sections and entries.'''
    '''@receive JSON as format: {sectionChanges/entryChanges: {insert: [{allInfoWith<'tmp_new_id'>}], update: [{allInfo}], remove: [onlyID]}}.'''
    '''         Each can be optional.'''
    insertedSectionIDMap = {}   # Map section temporary ID "new_##" to actual id after saved in database
    username = request.user.username

    # First valid data
    for changeSet in ['sectionChanges', 'entryChange']:
        if data.get(changeSet) is None:
            data[changeSet] = {}
        for action in ['insert', 'update', 'remove']:
            if data[changeSet].get(action) is None:
                data[changeSet][action] = []

    def getModelInst (modelCls, info, isSection, isNew):
        modelProps = H.TIF(isSection, ['name', 'order'], ['section_id', 'order_in_section', 'thumbnail_image_src', 'title', 'target_link'])
        if not isSection:
            # Update Entry info
            bosResource.ensure_file_path(info['thumbnail_image_src'])
            if insertedSectionIDMap.get(info['section_id']) is not None:
                info['section_id'] = insertedSectionIDMap[info['section_id']]
            phTitle = info.get('photographyTitle')
            if phTitle is not None and len(phTitle) > 0:
                photographies = Photography.objects.filter(title=phTitle)
                H.ensure(len(photographies) == 1, E.RequestParamException, 'Photography Title (%s) does not exists.' % phTitle)
                info['photographyId'] = photographies[0].id
        if isNew:
            inst = modelCls(username=username)
        else:
            inst = modelCls.objects.get(id=info['id'], username=username)
        for modelProp in modelProps:
            if info.get(modelProp) is not None:
                inst.__setattr__(modelProp, info[modelProp])
        return inst
    def applyChanges (actions, isSection):
        changes = data[H.TIF(isSection, 'sectionChanges', 'entryChanges')]
        modelCls = H.TIF(isSection, Section, Entry)
        if 'remove' in actions:
            itemsToRemove = modelCls.objects.filter(id__in=changes['remove'], username=username)
            H.ensure(len(itemsToRemove) == len(changes['remove']), E.DataException, 'applySectionAndEntryChanges: %s count retrieved from database with removed id doesn\'t equal to deleted entries id count in request.' % modelCls.__name__)
            itemsToRemove.delete()
        if 'update' in actions:
            for info in changes['update']:
                getModelInst(modelCls, info, isSection, isNew=False).save(force_update=True)
        if 'insert' in actions:
            for info in changes['insert']:
                inst = getModelInst(modelCls, info, isSection, isNew=True)
                inst.save(force_insert=True)
                if isSection:
                    insertedSectionIDMap[info['tmp_new_id']] = inst.id

    applyChanges(['insert', 'update'], isSection=True)
    applyChanges(['insert', 'update', 'remove'], isSection=False)
    applyChanges(['remove'], isSection=True)

    return {}

@route.path(r'^upload_image$')
@require_POST
@json_request(receiveJson = False, transaction=True)
def upload_image (data, request):
    '''Upload image to BAE cloud storage.'''
    '''@receive FormData "username": string, "allowOverwrite": boolean, "images" : <files in request.FILES>'''
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
                raise E.JsonRequestException(EnumErrorCodes.OverwriteNotAllowed, 'Attempt to overwrite existed image with name (%s) while not allow to overwrite.' % imgSaveName)
        else:
            raise E.BAEException('%s: Saving image to BAE bucket failed. Image name:%s. Error info: %s' % (methodName, img.name, response))

    return savedImgs
