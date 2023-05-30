from django.contrib import admin
from .models import Restaurant


class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('restaurant_id', 'name', 'park',
                    'area', 'opening_hour', 'closing_hour')
    search_fields = ('name', 'restaurant_types')
    list_filter = ('park', 'area', 'restaurant_types',
                   'opening_hour', 'closing_hour')


admin.site.register(Restaurant, RestaurantAdmin)


class RestaurantEmployeeArea(admin.AdminSite):
    site_header = 'Restaurant Employee Area'


restaurant_employee_admin_site = RestaurantEmployeeArea(
    name="Restaurant Admin")
restaurant_employee_admin_site.register(Restaurant, RestaurantAdmin)
