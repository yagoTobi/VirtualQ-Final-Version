import { useState } from "react";
import { Platform, Keyboard } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { dateValue, displayDate, localDate } from "@/lib/dates";

export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimum?: string;
  maximum?: string;
};

export function DateField({
  label,
  value,
  onChange,
  minimum,
  maximum,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const options = {
    value: value ? dateValue(value) : new Date(),
    minimumDate: minimum ? dateValue(minimum) : undefined,
    maximumDate: maximum ? dateValue(maximum) : undefined,
    onValueChange: (_event: unknown, date: Date) => {
      onChange(localDate(date));
      setOpen(false);
    },
  };
  return (
    <FormControl>
      <FormControlLabel>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>
      <Button
        variant="outline"
        accessibilityLabel={`${label}: ${value ? displayDate(value) : "Choose date"}`}
        onPress={() => {
          Keyboard.dismiss();
          if (Platform.OS === "android")
            DateTimePickerAndroid.open({ ...options, mode: "date" });
          else setOpen(!open);
        }}
      >
        <ButtonText>{value ? displayDate(value) : "Choose date"}</ButtonText>
      </Button>
      {open && <DateTimePicker {...options} mode="date" display="inline" />}
    </FormControl>
  );
}
