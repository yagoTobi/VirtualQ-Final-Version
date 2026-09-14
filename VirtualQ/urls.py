"""VirtualQ URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rideApp.admin import ride_employee_admin_site
from restaurantApp.admin import restaurant_employee_admin_site
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/restaurantEmployee/", restaurant_employee_admin_site.urls),
    path("api/rideEmployee/", ride_employee_admin_site.urls),
    path("api/parkRides/", include("rideApp.urls")),
    path("api/employees/", include("adminApp.urls")),
    path("api/stores/", include("storeApp.urls")),
    path("api/restaurants/", include("restaurantApp.urls")),
    path("api/clients/", include("clientApp.urls")),
    path("api/tickets/", include("ticketApp.urls")),
    path("api/queue/", include("queueApp.urls")),
]

admin.site.index_title = "Dashboard"
admin.site.site_header = "Virtual Q. Administration"
admin.site.site_title = "Administration Dashboard"

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
