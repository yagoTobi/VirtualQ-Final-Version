# Generated by Django 4.1.3 on 2023-05-29 09:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clientApp", "0007_customuser_name_alter_customuser_first_name"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customuser",
            name="id",
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]