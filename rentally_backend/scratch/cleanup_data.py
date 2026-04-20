import os, sys, django
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()
from api.models import Region, Listing
from django.db.models import Q
from django.utils.text import slugify

def fix_db():
    test_q = Q(title__icontains='test') | Q(description__icontains='test') | Q(address__icontains='test')
    archived_count = Listing.objects.filter(test_q).exclude(status='archived').update(status='archived')

    slug_map = {
        "Баянзүрх дүүрэг": "bayanzurkh",
        "Сүхбаатар дүүрэг": "sukhbaatar",
        "Хан-Уул дүүрэг": "han-uul",
        "Баянгол дүүрэг": "bayangol",
        "Сонгинохайрхан дүүрэг": "songino-khairkhan",
        "Чингэлтэй дүүрэг": "chingeltei",
        "Налайх дүүрэг": "nalaikh",
        "Багануур дүүрэг": "baganuur",
        "Багахангай дүүрэг": "bagakhangai",
        "Улаанбаатар": "ulaanbaatar",
    }

    for r in Region.objects.all():
        old_slug = r.slug
        new_slug = slug_map.get(r.name) or slugify(r.name)
        if old_slug != new_slug:
            r.slug = new_slug
            r.save()

if __name__ == "__main__":
    fix_db()
