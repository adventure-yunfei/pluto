import inspect
import time
import math

def TIF (condition, trueResult, falseResult):
    '''Condition ternary operation.'''
    '''@return: trueResult if condition==True. falseResult otherwise.'''
    if condition:
        return trueResult
    else:
        return falseResult
    
def getModuleClasses (module):
    '''Get available classes defined in specified module.'''
    if not inspect.ismodule(module):
        return None
    else:
        clsTuples = inspect.getmembers(module, inspect.isclass)
        classes = []
        for clsTuple in clsTuples:
            cls = clsTuple[1]
            if cls.__module__ == module.__name__:
                classes.append(cls)
        return classes
    
def ensure (condition, exceptionCls, msg):
    if not condition:
        raise exceptionCls(msg)

def toUTF8(asciiOrUnicodeStr):
    return asciiOrUnicodeStr.encode('utf-8')

def datetime2timestamp (datetimeObj):
    return math.floor(time.mktime(datetimeObj.timetuple()) * 1000)