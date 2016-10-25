from django.utils import timezone
from django.db.models import Max, Model
from django.db.models.query import QuerySet

import datetime

import helper as H
import exceptions as E

def autoSetFields(modelInst, orderCol=None, createDateCol=None, modifyDateCol=None):
    '''When save model, automatically set specified fields if not manually set (see details in @param below).'''
    '''Note that it can ONLY be used for models with AutoField "id" as primary key.'''
    '''@param modelInst: A model instance to be saved to database.'''
    '''@param orderCol: order column name in model. Auto set as maximum.'''
    '''@param createDateCol: create_date column name in model. Auto set as current time for new record.'''
    '''@param modifyDateCol: modify_date column name in model. Auto set as current time for any record.'''
    currentTime = timezone.now()
    if modelInst.id is None:    # New Record.
        if orderCol is not None and modelInst.__getattribute__(orderCol) is None:
            records = modelInst.__class__.objects.all().order_by('-'+orderCol)
            if len(records) == 0:
                maxOrder = 0
            else:
                maxOrder = records[0].__getattribute__(orderCol)
            modelInst.__setattr__(orderCol, maxOrder+1)
        if createDateCol is not None and modelInst.__getattribute__(createDateCol) is None:
            modelInst.__setattr__(createDateCol, currentTime)

    if modifyDateCol is not None and modelInst.__getattribute__(modifyDateCol) is None:
        modelInst.__setattr__(modifyDateCol, currentTime)

def max(querySet, column):
    '''Get maximum value for specified column from a query result set.'''
    '''@param querySet: A QuerySet instance indicating a query result.'''
    '''@param column: string. The column name that it find maximum value for.'''
    '''@return: Maximum value.'''
    return querySet.aggregate(Max(column))[column + '__max']

def updateSingle(modelCls, queryKeyArgs, updateKeyArgs):
    '''Update model, forcing that query returns one and only one result, and set its value.'''
    querySet = modelCls.objects.filter(**queryKeyArgs)
    H.ensure(len(querySet) == 1, E.AssertFailed, 'modelsHelper.updateSingle: Query set should contains one and only one result.')
    querySet.update(**updateKeyArgs)

def setTempOrder(modelCls, idInfos, orderColumn='order'):
    '''Set order column of model to a temporary value (negative) for later reorder, as order column is unique.'''
    '''@param modelCls: Model class.'''
    '''@param idInfos: ID array (each as id string) or ID info array (each as dict containing "id".'''
    '''@param orderColumn: String. Specify order column name in the model.'''
    tempOrder = -1
    for idInfo in idInfos:
        mid = H.TIF(isinstance(idInfo, dict), idInfo['id'], idInfo)
        updateSingle(modelCls, {'id':mid}, {orderColumn: tempOrder})
        tempOrder -= 1

def jsonize (modelInput):
    if isinstance(modelInput, Model):
        def getVal (attr):
            val = getattr(modelInput, attr)
            if isinstance(val, datetime.datetime):
                return H.datetime2timestamp(val)
            else:
                return val

        return dict([(attr, getVal(attr)) for attr in [f.column for f in modelInput._meta.fields]])
    elif isinstance(modelInput, QuerySet):
        return [jsonize(modelInst) for modelInst in modelInput]
    else:
        raise Exception('Method "jsonize" only accepts model inst or model query set.')
