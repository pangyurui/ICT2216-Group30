from django.contrib import admin
from .models import Product, Organisation

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'created_at', 'modified_at', 'deleted_at')
    list_filter = ('created_at', 'modified_at', 'deleted_at')

@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ('name', 'desc', 'created_at', 'modified_at', 'deleted_at')
    list_filter = ('created_at', 'modified_at', 'deleted_at')