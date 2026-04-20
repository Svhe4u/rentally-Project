import os, sys, django, shutil
from pathlib import Path

sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()

from api.models import Listing, ListingImage, Region, Category, User, ListingDetail
from django.core.files import File

def populate():
    # 1. Setup paths
    base_dir = Path('c:/Users/Newtech/Documents/GitHub/rentally-Project/rentally_backend')
    media_dir = base_dir / 'media' / 'listings'
    media_dir.mkdir(parents=True, exist_ok=True)

    artifact_dir = Path('C:/Users/Newtech/.gemini/antigravity/brain/cd341f93-2c9f-4321-90ca-44e95198180f')
    
    images = [
        {'src': 'khan_uul_apartment_1776670584811.png', 'dst': 'khan_uul.png'},
        {'src': 'bayanzurkh_apartment_1776670609397.png', 'dst': 'bayanzurkh.png'},
        {'src': 'sukhbaatar_apartment_1776670625431.png', 'dst': 'sukhbaatar.png'},
    ]

    for img in images:
        src_path = artifact_dir / img['src']
        dst_path = media_dir / img['dst']
        if src_path.exists():
            shutil.copy(src_path, dst_path)
            print(f"Copied {img['src']} to {dst_path}")

    # 2. Get dependencies
    cat_apt = Category.objects.get(id=1) # Орон сууц
    owner = User.objects.get(id=1) # testuser
    
    region_khan = Region.objects.get(id=11)
    region_bzk = Region.objects.get(id=9)
    region_sb = Region.objects.get(id=8)

    # 3. Create Listings
    listings_data = [
        {
            'title': "Хан-Уул дүүрэгт люкс 3 өрөө байр",
            'desc': "Ривер гарден хотхонд маш тохилог, бүрэн тавилгатай 3 өрөө байр түрээслүүлнэ. Цэвэр агаар, аюулгүй орчин.",
            'addr': "Ривер Гарден, Хан-Уул дүүрэг",
            'price': 3500000,
            'reg': region_khan,
            'img': 'listings/khan_uul.png',
            'lat': 47.860, 'lng': 106.900,
            'bedrooms': 3, 'area': 120
        },
        {
            'title': "Баянзүрх дүүрэгт тохилог 2 өрөө байр",
            'desc': "Шинэ ашиглалтанд орсон, маш дулаахан 2 өрөө байр. Гал тогооны тавилгатай.",
            'addr': "13-р хороолол, Баянзүрх дүүрэг",
            'price': 1800000,
            'reg': region_bzk,
            'img': 'listings/bayanzurkh.png',
            'lat': 47.920, 'lng': 106.970,
            'bedrooms': 2, 'area': 55
        },
        {
            'title': "Сүхбаатар дүүрэг, хотын төвд 1 өрөө студи",
            'desc': "Хотын төвд байршилтай, бүрэн тавилгатай студи байр. Гадаад хүнд түрээслүүлнэ.",
            'addr': "Төв шуудангийн ойролцоо, Сүхбаатар дүүрэг",
            'price': 1200000,
            'reg': region_sb,
            'img': 'listings/sukhbaatar.png',
            'lat': 47.920, 'lng': 106.845,
            'bedrooms': 1, 'area': 35
        },
    ]

    for data in listings_data:
        lst = Listing.objects.create(
            owner=owner,
            category=cat_apt,
            region=data['reg'],
            title=data['title'],
            description=data['desc'],
            address=data['addr'],
            price=data['price'],
            price_type='monthly',
            status='active',
            latitude=data['lat'],
            longitude=data['lng']
        )
        # Add Image
        ListingImage.objects.create(
            listing=lst,
            image_url=data['img'],
            is_primary=True
        )
        # Add Detail
        ListingDetail.objects.create(
            listing=lst,
            bedrooms=data['bedrooms'],
            area_sqm=data['area']
        )
    # No print statements here to avoid Unicode errors in this environment
    pass

if __name__ == "__main__":
    populate()
