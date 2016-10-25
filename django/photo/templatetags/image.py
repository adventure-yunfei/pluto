from django import template
from django.core.exceptions import ObjectDoesNotExist

from photo.models import Image
from photo import exceptions as E, viewsHelper as VH, helper as H, bosResource

# Constant.
imgTagTemplateStr = '<img class="PhotographyImage" data-path="{{imgPath}}" src="{{normalizedImgSrc}}" onclick="window.open(\'{{originImgSrc}}\');" />'

register = template.Library()

class ImageNode(template.Node):
    def __init__ (self, imgName):
        self.imgName = imgName
    def render (self, context):
        username = VH.getDisplayUsername(context['user'])
        try:
            image = Image.objects.get(name=self.imgName, username=username)
        except ObjectDoesNotExist:
            raise E.DataException('ImageNode.render: Specified (username,name): (%s,%s), does not exist in Image model\'s table.' % (username,self.imgName))
        # In preview, display origin image if normalized image doesn't exist
        origin_src = bosResource.get_img_url(image.src)
        normalized_src = bosResource.resize_img_by_max_size(image.src, 800)
        return template.Template(imgTagTemplateStr).render(template.Context({'imgPath': image.src, 'originImgSrc':origin_src, 'normalizedImgSrc':normalized_src}))

@register.tag('image')
def do_image (parser, token):
    '''For custom tag "image".'''
    '''image tag format: {% image imgName %}, which imgName is one of Image.name in database, username is specified in Context.user (as request.user).'''
    methodName = 'do_image'
    try:
        tagName, imgName = token.split_contents()
    except ValueError:
        raise template.TemplateSyntaxError('%s: %s tag accept one and only one argument.' % (methodName, token.split_contents()[0]))
    if imgName[0] != '"' or imgName[-1] != '"':
        raise template.TemplateSyntaxError('%s: Argument imgName should be wrapped with double quote: imgName=%s.' % (methodName, imgName))

    return ImageNode(imgName[1:-1])
