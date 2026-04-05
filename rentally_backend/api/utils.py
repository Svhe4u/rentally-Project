"""
Utility functions for Rentally API.
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('api')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that standardizes error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize error format
        if isinstance(response.data, dict):
            # Already in dict format, keep as is
            pass
        elif isinstance(response.data, list):
            response.data = {'errors': response.data}
        else:
            response.data = {'error': str(response.data)}

        # Add status code
        response.data['status_code'] = response.status_code

    return response


def format_mnt(amount):
    """Format amount in Mongolian Tugrik."""
    if amount is None:
        return "N/A"
    try:
        amount = float(amount)
        return f"{amount:,.0f} ₮"
    except (TypeError, ValueError):
        return str(amount)


def generate_transaction_id():
    """Generate unique transaction ID for payments."""
    import uuid
    return str(uuid.uuid4()).replace('-', '').upper()[:20]
