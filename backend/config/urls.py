from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from app.internal.app import api

urlpatterns = [
    path('', lambda request: redirect('/api/docs')),
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]


