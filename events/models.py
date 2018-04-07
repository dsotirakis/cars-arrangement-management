# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.core.exceptions import ValidationError
from django.core.urlresolvers import reverse

# Create your models here.
class CarCategory(models.Model):
    car_category_name = models.CharField(max_length=140)
    def __str__(self):
        return self.car_category_name

    class Meta:
        verbose_name = u'Car Category'
        verbose_name_plural = u'Car Categories'

class Cars(models.Model):
    car_name = models.TextField(u'CarName', help_text = u'CarName')
    weight = models.IntegerField(u'Weight', help_text = u'Weight')
    car_category_name = models.ForeignKey(CarCategory)
    def __str__(self):
        return self.car_name

    class Meta:
        verbose_name = u'Car'
        verbose_name_plural = u'Cars'

class Event(models.Model):
    car_name = models.ForeignKey(Cars)
    day = models.DateField(u'Day of the event', help_text=u'Day of the event')
    start_time = models.TimeField(u'Starting time', help_text=u'Starting time')
    end_time = models.TimeField(u'Final time', help_text=u'Final time')
    notes = models.TextField(u'Textual Notes', help_text=u'Textual Notes', blank=True, null=True)
    
    class Meta:
        verbose_name = u'Scheduling'
        verbose_name_plural = u'Scheduling'

    def check_overlap(self, fixed_start, fixed_end, new_start, new_end):
        overlap = False
        if new_start == fixed_end or new_end == fixed_start:    #edge case
            overlap = False
        elif (new_start >= fixed_start and new_start <= fixed_end) or (new_end >= fixed_start and new_end <= fixed_end): #innner limits
            overlap = True
        elif new_start <= fixed_start and new_end >= fixed_end: #outter limits
            overlap = True

        return overlap

    def get_absolute_url(self):
        url = reverse('admin:%s_%s_change' % (self._meta.app_label, self._meta.model_name), args=[self.id])
        return u'<a href="%s">%s</a>' % (url, str(self.car_name))

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError('Ending hour must be after the starting hour')

        events = Event.objects.filter(day=self.day)
        if events.exists():
            for event in events:
                if self.check_overlap(event.start_time, event.end_time, self.start_time, self.end_time):
                    raise ValidationError(
                        'There is an overlap with another event: ' + str(event.day) + ', ' + str(
                            event.start_time) + '-' + str(event.end_time))

