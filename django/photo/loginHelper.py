from django.utils import timezone

from photo import exceptions as E

maxLoginTimes = 10      # Maximum login times for the same ip
trackDuration = 3600    # Only allow specified login times during this duration (seconds)
loginTimes = {}         # Record login trial times for different ips during recenet specified time. Format: {ip: {startTime, count}}

def preLogin (ip):
    '''Before do login, record ip login times and check whether reaches limitation.'''
    '''If reach maximum login times, raise exception to stop login.'''
    currentTime = timezone.now()
    if not loginTimes.get(ip) or (currentTime - loginTimes[ip]['startTime']).total_seconds() > trackDuration:   # New ip or track duration expired
        loginTimes[ip] = {'startTime': currentTime, 'count': 1}
    else:
        loginTimes[ip]['count'] += 1
        if loginTimes[ip]['count'] > maxLoginTimes:
            raise E.ReachMaxLoginTimes('Your ip reached maximum login times. Please try it later')
        
def postLogin (ip):
    '''After successful login, clear login times record.'''
    loginTimes.pop(ip)