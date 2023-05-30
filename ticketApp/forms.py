# forms.py

import datetime
from django import forms


# forms.py
class VisitForm(forms.Form):
    date_of_visit = forms.DateField(widget=forms.SelectDateWidget())
    additional_guests = forms.IntegerField(required=False)

    def clean(self):
        cleaned_data = super().clean()
        additional_guests = cleaned_data.get("additional_guests")

        if additional_guests and (additional_guests <= 0):
            raise forms.ValidationError(
                "If there are additional guests, the number of guests must be provided and greater than 0."
            )
        
    def clean_date_of_visit(self):
        date_of_visit = self.cleaned_data.get('date_of_visit')
        if date_of_visit and date_of_visit < datetime.date.today():
            raise forms.ValidationError("The date of visit cannot be in the past.")
        return date_of_visit

