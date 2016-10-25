class Unclassified (Exception):
    pass
class TemporaryNotSupported (Exception):
    pass

class JsonRequestException:
    def __init__ (self, errorCode, message = '', data = {}):
        self.data = dict(data, e=errorCode, message=message)

class BAEException (Exception):
    '''Exception when operation on BAE product is failed'''
    '''E.g. Saving image to bucket failed'''

class DataException (Exception):
    '''Exception when data to be handled is not correct in some way.'''
    '''This may be a general exception.'''
    
class DatabaseRecordException (Exception):
    '''Exception when records in database is not correct to meet requirements.'''
    '''Such as duplicate record for unique column'''
    
class DatabaseNoMatchRecordException (Exception):
    '''Exception when no record matching with specified condition.'''

class HttpException (Exception):
    '''Exception when http error, such as invalid URL.'''

class RequestParamException (Exception):
    '''Exception when request parameters are not correct so that cannot be handled.'''

class RequestMethodException (Exception):
    '''Exception when request method is not correct.'''

class PermissionException (Exception):
    '''Exception when user has no specified permission.'''
    
class ReachMaxLoginTimes (Exception):
    '''Exception when ip tried login after limited times.'''
    
class AssertFailed (Exception):
    '''Exception when customized assertion failed.'''
