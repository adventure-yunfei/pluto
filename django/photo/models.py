from django.db import models

import modelsHelper as MH

class Section (models.Model):
    '''Model of section in Home page. order should be unique'''
    username = models.CharField(max_length=30)
    order = models.IntegerField()
    name = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['order']
        unique_together = [('username', 'name')]
        
    def __unicode__ (self):
        return self.name
        
    def save (self, force_insert=False, force_update=False, using=None):
        MH.autoSetFields(self, orderCol='order')
        super(Section,self).save(force_insert, force_update, using)
        
class Photography (models.Model):
    '''Model of photography article. Displayed in photography page.'''
    username = models.CharField(max_length=30)
    order = models.IntegerField()
    title = models.CharField(max_length=200)
    content = models.TextField()
    create_date = models.DateTimeField()
    modify_date = models.DateTimeField()
    
    class Meta:
        unique_together = [('username', 'title')]
    
    def __unicode__ (self):
        return self.title
    
    def save (self, force_insert=False, force_update=False, using=None):
        MH.autoSetFields(self, orderCol='order', createDateCol='create_date', modifyDateCol='modify_date')
        super(Photography,self).save(force_insert, force_update, using)
        
class Entry (models.Model):
    '''Model of photography entry. Displayed as thumbnail in a section of Home page and link to a target page.'''
    username = models.CharField(max_length=30)
    section = models.ForeignKey(Section)
    order_in_section = models.IntegerField()
    title = models.CharField(max_length=200)
    thumbnail_image_src = models.URLField(max_length=200)
    target_link = models.URLField(max_length=200)
    
    class Meta:
        ordering = ['section', 'order_in_section']
    
    def __unicode__ (self):
        return self.thumbnail_image_src
    
    def save (self, force_insert=False, force_update=False, using=None):
        MH.autoSetFields(self, orderCol='order_in_section')
        super(Entry,self).save(force_insert, force_update, using)
        
class Image (models.Model):
    '''Model of main image, with each record containing both normalized and origin image src.'''
    '''order here is reserved to display all images in an image page in future.'''
    username = models.CharField(max_length=30)
    order = models.IntegerField()
    name = models.CharField(max_length=200)
    src = models.CharField(max_length=200)
    create_date = models.DateTimeField()
    
    class Meta:
        ordering = ['order']
        unique_together = [('username', 'name')]
        
    def __unicode__ (self):
        return self.name
    
    def save (self, force_insert=False, force_update=False, using=None):
        MH.autoSetFields(self, orderCol='order', createDateCol='create_date')
        super(Image,self).save(force_insert, force_update, using)
