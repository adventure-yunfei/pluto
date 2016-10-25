from django.shortcuts import render
from photo import viewsHelper as VH

route = VH.Route()

@route.path(r'^$')
def index (request):
    return render(request, 'game2048/game2048.html')
