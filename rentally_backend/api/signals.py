"""
Django Signals for Rentally API.
Automates profile creation and other side effects.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone

from .models import UserProfile, BrokerProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    User шинээр үүсэхэд UserProfile автоматаар үүсгэнэ.
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    User хадгалагдах үед Profile-г бас хадгална.
    """
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(post_save, sender=BrokerProfile)
def update_user_role_on_broker_approval(sender, instance, created, **kwargs):
    """
    Брокерийн хүсэлт баталгаажих үед хэрэглэгчийн role-г broker болгоно.
    """
    if instance.status == 'approved' and not created:
        # Check if status changed to approved
        try:
            old_instance = BrokerProfile.objects.get(pk=instance.pk)
            if old_instance.status != 'approved':
                # Status changed to approved
                profile = instance.user.profile
                profile.role = 'broker'
                profile.is_verified = True
                profile.save()
        except BrokerProfile.DoesNotExist:
            pass
    elif instance.status == 'approved' and created:
        # Newly created as approved
        profile = instance.user.profile
        profile.role = 'broker'
        profile.is_verified = True
        profile.save()
