from django.shortcuts import render
from photo import viewsHelper as VH
from photo.globalConfig import config

route = VH.Route()

@route.path(r'^$')
def index (request):
    context = {'hosts': config['hosts']}
    return render(request, 'entrance/entrance.html', context)
