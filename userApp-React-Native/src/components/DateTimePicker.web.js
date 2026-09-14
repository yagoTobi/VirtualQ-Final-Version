import React from "react";
import { format } from "date-fns";

export default function DateTimePicker({ value, onChange }) {
  return (
    <input
      aria-label="Date of birth"
      type="date"
      value={format(value, "yyyy-MM-dd")}
      onChange={(event) => {
        if (event.target.value) {
          onChange(event, new Date(`${event.target.value}T00:00:00`));
        }
      }}
    />
  );
}
