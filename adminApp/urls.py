from django.urls import path
from . import views

urlpatterns = [
    path(
        "employees/",
        views.ParkEmployeeListCreateView.as_view(),
        name="park_employee_list_create",
    ),
    path(
        "employees/<int:pk>/",
        views.ParkEmployeeRetrieveUpdateDestroyView.as_view(),
        name="park_employee_retrieve_update_destroy",
    ),
]
