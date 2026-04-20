import os, sys, django, json
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()
from api.models import Region, Listing

def verify():
    # Verify regions
    regions = []
    for r in Region.objects.all():
        regions.append({"id": r.id, "name": r.name, "slug": r.slug})
    
    with open('scratch/verify_regions.json', 'w', encoding='utf-8') as f:
        json.dump(regions, f, ensure_ascii=False, indent=2)

    # List all active listings and their regions
    active_listings = []
    for l in Listing.objects.filter(status='active').select_related('region'):
        active_listings.append({
            "id": l.id,
            "title": l.title,
            "region_name": l.region.name if l.region else "None",
            "region_slug": l.region.slug if l.region else "None"
        })

    # Test search result for a district name if any exist
    from api.services import ListingService
    search_results = {}
    
    # Try searching for each region that has at least one listing
    regions_with_listings = set(l['region_name'] for l in active_listings if l['region_name'] != "None")
    for r_name in regions_with_listings:
        # Search by name
        results = list(ListingService.get_listings_queryset({'search': r_name}).values('id', 'title', 'region__name'))
        search_results[r_name] = results

    result = {
        "active_listings": active_listings,
        "search_results_by_district_name": search_results
    }
    
    with open('scratch/verify_search.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    verify()
