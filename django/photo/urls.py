from django.conf.urls import include, url
import views as photoViews
import photoAPIViews
import game2048.views as game2048Views
import entrance.views as entranceViews

urlpatterns = [
    url(r'^photo/', include(photoAPIViews.route.urls)),
    url(r'^game2048/', include(game2048Views.route.urls)),
    url(r'^entrance/', include(entranceViews.route.urls)),
    url(r'^', include(photoViews.route.urls))
]
