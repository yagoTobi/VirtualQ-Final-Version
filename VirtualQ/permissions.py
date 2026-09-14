from rest_framework.permissions import DjangoModelPermissions, SAFE_METHODS


class StaffModelPermissions(DjangoModelPermissions):
    """Staff status and the specific Django model permission are both required."""

    perms_map = {
        **DjangoModelPermissions.perms_map,
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": ["%(app_label)s.view_%(model_name)s"],
    }

    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and request.user.is_staff
                    and super().has_permission(request, view))


class PublicReadStaffWrite(StaffModelPermissions):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or super().has_permission(request, view)
