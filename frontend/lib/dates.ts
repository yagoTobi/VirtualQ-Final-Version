export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateValue(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function visitDate(value?: string) {
  return value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    localDate(dateValue(value)) === value
    ? value
    : localDate();
}

export function displayDate(value: string) {
  return dateValue(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
