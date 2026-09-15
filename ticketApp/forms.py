from django import forms
from django.utils import timezone

from .services import MAX_ADDITIONAL_GUESTS

class VisitForm(forms.Form):
    date_of_visit = forms.DateField(widget=forms.SelectDateWidget())
    additional_guests = forms.IntegerField(
        required=False, min_value=0, max_value=MAX_ADDITIONAL_GUESTS, initial=0
    )
    confirm_removal = forms.BooleanField(
        required=False,
        label="I confirm removing extra tickets and their ride reservations.",
    )

    def clean_additional_guests(self):
        return self.cleaned_data.get("additional_guests") or 0

    def clean_date_of_visit(self):
        date_of_visit = self.cleaned_data["date_of_visit"]
        if date_of_visit < timezone.localdate():
            raise forms.ValidationError("The date of visit cannot be in the past.")
        return date_of_visit
