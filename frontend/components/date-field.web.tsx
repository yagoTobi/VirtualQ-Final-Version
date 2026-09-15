import { useId } from "react";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import type { DateFieldProps } from "./date-field";

export function DateField({
  label,
  value,
  onChange,
  minimum,
  maximum,
}: DateFieldProps) {
  const id = useId();
  return (
    <FormControl>
      <FormControlLabel>
        <FormControlLabelText nativeID={id}>{label}</FormControlLabelText>
      </FormControlLabel>
      <input
        aria-labelledby={id}
        type="date"
        value={value}
        min={minimum}
        max={maximum}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground focus:outline-primary"
      />
    </FormControl>
  );
}
