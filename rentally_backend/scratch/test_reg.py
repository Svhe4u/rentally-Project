import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from api.auth_views import RegisterAPIView

factory = APIRequestFactory()
view = RegisterAPIView.as_view()

data = {
    'username': 'testuser_500_debug',
    'email': 'test500@example.com',
    'password': 'password123',
    'password2': 'password123',
    'first_name': 'Test',
    'last_name': 'User',
    'phone': '99112233',
    'role': 'user'
}

import sys
import io

# Force UTF-8 for printing Mongolian characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

request = factory.post('/api/auth/register/', data, format='json')
try:
    response = view(request)
    print(f"Status Code: {response.status_code}")
    # Convert data to string carefully
    import json
    print(f"Response Data: {json.dumps(response.data, ensure_ascii=False)}")
except Exception as e:
    import traceback
    print("CRASH DETECTED!")
    traceback.print_exc()
finally:
    # Cleanup
    User.objects.filter(username='testuser_500_debug').delete()
