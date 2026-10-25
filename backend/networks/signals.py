from django.db import transaction
from django.db.models import Q
from django.db.models.signals import pre_delete, pre_save
from django.dispatch import receiver

from equipment.models import Equipment

from .models import NetworkDirection, NetworkMembership


@receiver(pre_save, sender=Equipment)
def cleanup_network_memberships_on_equipment_move(sender, instance, **kwargs):
    """
    При перемещении оборудования между подразделениями/объектами
    удаляет устаревшие NetworkMembership и связанные NetworkDirection.
    """
    if not instance.pk:
        return

    try:
        old_equipment = Equipment.objects.get(pk=instance.pk)
    except Equipment.DoesNotExist:
        return

    division_changed = (old_equipment.division_id != instance.division_id)
    facility_changed = (old_equipment.facility_id != instance.facility_id)
    if not (division_changed or facility_changed):
        return

    with transaction.atomic():
        old_memberships = NetworkMembership.objects.filter(
            equipment=instance, division=old_equipment.division,
        )
        if old_equipment.facility_id:
            old_memberships = old_memberships.filter(facility=old_equipment.facility)

        membership_ids = list(old_memberships.values_list('id', flat=True))
        if not membership_ids:
            return

        NetworkDirection.objects.filter(
            Q(from_membership_id__in=membership_ids) |
            Q(to_membership_id__in=membership_ids)
        ).delete()
        old_memberships.delete()


@receiver(pre_delete, sender=Equipment)
def cleanup_network_memberships_on_equipment_delete(sender, instance, **kwargs):
    """
    При удалении оборудования удаляет все его членства и направления.
    """
    with transaction.atomic():
        memberships = NetworkMembership.objects.filter(equipment=instance)
        membership_ids = list(memberships.values_list('id', flat=True))
        if not membership_ids:
            return

        NetworkDirection.objects.filter(
            Q(from_membership_id__in=membership_ids) |
            Q(to_membership_id__in=membership_ids)
        ).delete()
        memberships.delete()