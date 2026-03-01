# -*- coding: utf-8 -*-
"""
Email helpers for Rentally.
Sends password reset and verification emails via Gmail SMTP.
"""

from django.core.mail import send_mail
from django.conf import settings


def send_password_reset_email(email, uid, token):
    """
    Send password reset link to user's email.
    Link format: {FRONTEND_URL}/reset-password?uid={uid}&token={token}
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_url = f"{frontend_url.rstrip('/')}/reset-password?uid={uid}&token={token}"

    subject = "Rentally – Нууц үг сэргээх холбоос"
    message = f"""Сайн байна уу,

Та Rentally нууц үгээ сэргээх хүсэлт илгээсэн.

Дараах холбоос дээр дарж шинэ нууц үг оруулна уу:
{reset_url}

Энэ холбоос 24 цагийн дотор хүчинтэй.

Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомжлоорой.

Rentally баг"""
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]
    fail_silently = False

    return send_mail(
        subject,
        message,
        from_email,
        recipient_list,
        fail_silently=fail_silently,
    )
