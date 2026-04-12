import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rentally_backend.settings')
django.setup()

def get_columns(table_name):
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
        return [r[0] for r in cursor.fetchall()]

tables = [
    'api_userprofile',
    'api_brokerprofile',
    'api_message',
    'api_listing',
    'api_booking',
    'api_review'
]

for table in tables:
    print(f"{table}: {get_columns(table)}")
