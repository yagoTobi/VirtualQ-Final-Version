import { ComponentProps, useId } from "react";
import { Input, InputField } from "@/components/ui/input";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/form-control";

export function Field({
  label,
  error,
  hint,
  ...props
}: ComponentProps<typeof InputField> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <FormControl isInvalid={!!error}>
      <FormControlLabel>
        <FormControlLabelText nativeID={`${id}-label`}>
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Input>
        <InputField
          aria-label={label}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${id}-label`}
          autoCapitalize="none"
          {...props}
        />
      </Input>
      {hint && (
        <FormControlHelper>
          <FormControlHelperText>{hint}</FormControlHelperText>
        </FormControlHelper>
      )}
      {error && (
        <FormControlError>
          <FormControlErrorText>{error}</FormControlErrorText>
        </FormControlError>
      )}
    </FormControl>
  );
}
