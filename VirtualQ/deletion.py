from django.contrib.admin.utils import NestedObjects
from django.db import router, transaction
from rest_framework.exceptions import PermissionDenied, ValidationError


def deletion_summary(instance, user):
    """Use Django's admin collector so cascades cannot bypass model permissions."""
    from queueApp.models import RideReservation

    collector = NestedObjects(using=router.db_for_write(type(instance)))
    collector.collect([instance])
    counts = []
    for model, objects in collector.data.items():
        opts = model._meta
        if not user.is_authenticated or not user.is_staff or not user.has_perm(
            f"{opts.app_label}.delete_{opts.model_name}"
        ):
            raise PermissionDenied("You need delete permission for every affected record type.")
        counts.append({"model": opts.label_lower, "label": str(opts.verbose_name_plural), "count": len(objects)})
        if model is RideReservation and any(not item.can_cancel() for item in objects):
            raise ValidationError("Admitted or completed reservations must be kept. Close the ride instead of deleting its history.")
    if collector.protected:
        raise ValidationError("Other records protect this item from deletion.")
    return sorted(counts, key=lambda item: item["model"])


class SafeDestroyMixin:
    @transaction.atomic
    def perform_destroy(self, instance):
        instance = type(instance).objects.select_for_update().get(pk=instance.pk)
        counts = deletion_summary(instance, self.request.user)
        if sum(item["count"] for item in counts) > 1 and self.request.query_params.get("confirm") != "true":
            raise ValidationError({
                "detail": "Confirm deletion of this item and its related records.",
                "affected": counts,
            })
        instance.delete()
