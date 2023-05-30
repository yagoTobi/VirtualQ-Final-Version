from django.contrib import admin
from .models import Store, Product


# Register your models here.
class StoreAdmin(admin.ModelAdmin):
    list_display = (
        "store_name",
        "store_description",
        "opening_hour",
        "closing_hour",
        "park_id",
        "area_id",
    )
    search_fields = ("store_id", "store_name", "area_id", "park_id")
    list_filter = ("park_id", "area_id", "store_name", "opening_hour", "closing_hour")


class ProductAdmin(admin.ModelAdmin):
    list_display = ("product_name", "store_name", "product_price")
    list_filter = ("store__store_name", "product_name", "product_price")

    def store_name(self, obj):
        return obj.store.store_name

    store_name.admin_order_field = "store__store_name"
    search_fields = ("store__store_name", "product_name", "product_price")


admin.site.register(Store, StoreAdmin)
admin.site.register(Product, ProductAdmin)
