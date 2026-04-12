from django.contrib.auth.models import User
from api.models import UserProfile
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()

def setup_admin():
    username = 'admin'
    password = 'admin123'
    email = 'admin@rentally.mn'
    
    user = User.objects.filter(username=username).first()
    if not user:
        user = User.objects.create_superuser(username, email, password)
        print(f"Created superuser: {username}")
    else:
        print(f"User {username} already exists")

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.role = 'admin'
    profile.save()
    print(f"Ensured user {username} has role 'admin'")

if __name__ == '__main__':
    setup_admin()
