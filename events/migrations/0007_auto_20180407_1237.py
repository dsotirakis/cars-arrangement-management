# -*- coding: utf-8 -*-
# Generated by Django 1.11.12 on 2018-04-07 12:37
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0006_auto_20180407_1231'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='carcategory',
            options={'verbose_name': 'Car Category', 'verbose_name_plural': 'Car Categories'},
        ),
        migrations.AlterModelOptions(
            name='cars',
            options={'verbose_name': 'Car', 'verbose_name_plural': 'Cars'},
        ),
    ]
