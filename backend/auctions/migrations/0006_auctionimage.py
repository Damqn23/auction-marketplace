# Generated by Django 5.1.4 on 2025-01-07 14:35

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0005_auctionitem_winner'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuctionImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='auction_images/')),
                ('auction_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='auctions.auctionitem')),
            ],
        ),
    ]
