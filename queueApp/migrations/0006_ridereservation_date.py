# Generated by Django 4.1.3 on 2023-05-28 11:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("queueApp", "0005_remove_ridereservation_additional_guests_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="ridereservation",
            name="date",
            field=models.DateField(null=True),
        ),
    ]
