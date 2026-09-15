export type Permissions = Record<"view" | "add" | "change" | "delete", boolean>;
export type Resource = {
  key: string;
  label: string;
  description: string;
  count: number;
  permissions: Permissions;
};
export type OperationsIndex = { resources: Resource[]; time_zone: string };
export type RecordData = Record<string, string | number | boolean | null>;
export type RecordPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: RecordData[];
};
export type FieldInfo = {
  type: string;
  label: string;
  read_only: boolean;
  required: boolean;
  allow_null: boolean;
  allow_blank: boolean;
  immutable: boolean;
  multiline: boolean;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  choices?: { value: string | number; display_name: string }[];
  resource?: string;
  default?: string | number | boolean;
};
export type Schema = {
  id_field: string;
  fields: Record<string, FieldInfo>;
  columns: string[];
  filters: string[];
  permissions: Permissions;
};
export type Affected = { model: string; label: string; count: number }[];
export const operationsPath = (resource: string) =>
  `/api/operations/${encodeURIComponent(resource)}/`;

export function fieldLabel(name: string, field?: FieldInfo) {
  const labels: Record<string, string> = {
    park_id: "Park",
    area_id: "Area",
    user: "Account",
    guest_number: "Party position",
    ride_capacity: "Capacity",
    ride_duration: "Duration (minutes)",
    height_restriction: "Minimum height (cm)",
    under_maintenance: "Under maintenance",
    validated: "Admitted",
    product_price: "Price",
    height: "Height (cm)",
    age: "Age (years)",
  };
  return labels[name] ?? field?.label ?? name.replaceAll("_", " ");
}

export function recordLabel(record: RecordData) {
  const name =
    record.visitor_name ||
    record.ride_name ||
    record.product_name ||
    record.store_name ||
    record.area_name ||
    record.name ||
    record.first_name ||
    record.park_name ||
    record.username;
  return (
    [
      name,
      record.first_name || record.name ? record.last_name : null,
      record.date_of_visit,
      record.username && record.username !== name
        ? `@${record.username}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Record"
  );
}
