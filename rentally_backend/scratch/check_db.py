import os, sys, django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()
from api.models import Region, Listing

import json

print("\n=== Listings without Region ===")
no_region = Listing.objects.filter(region__isnull=True, status='active')
for l in no_region:
    print(f"ID={l.id}, Title={l.title}")

print("\n=== Other potential test data ===")
other_test = Listing.objects.filter(Q(description__icontains='test') | Q(address__icontains='test'), status='active')
for l in other_test:
    print(f"ID={l.id}, Title={l.title}, Status={l.status}")
