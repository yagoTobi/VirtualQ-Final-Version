# Generated by Django 4.1.3 on 2023-05-19 19:43

import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("rideApp", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Store",
            fields=[
                ("store_id", models.AutoField(primary_key=True, serialize=False)),
                ("store_name", models.CharField(max_length=100, unique=True)),
                ("store_description", models.TextField()),
                ("store_thumbnail", models.ImageField(upload_to="store_thumbnail/")),
                ("opening_hour", models.TimeField(default=datetime.time(22, 0))),
                ("closing_hour", models.TimeField(default=datetime.time(22, 0))),
                (
                    "area_id",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="rideApp.themeparkarea",
                    ),
                ),
                (
                    "park_id",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="rideApp.themepark",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("product_id", models.AutoField(primary_key=True, serialize=False)),
                ("product_name", models.CharField(max_length=100)),
                ("product_description", models.TextField()),
                ("product_image", models.ImageField(upload_to="product_image/")),
                ("product_price", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "store",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="products",
                        to="storeApp.store",
                    ),
                ),
            ],
        ),
    ]
