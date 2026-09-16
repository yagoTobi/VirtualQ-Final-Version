import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import {
  Affected,
  FieldInfo,
  RecordData,
  RecordPage,
  Schema,
  fieldLabel,
  fieldValue,
  operationsPath,
  recordLabel,
} from "@/lib/operations";
import { Field } from "@/components/field";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";

const inputClass =
  "min-h-12 w-full rounded-md border border-input bg-card px-3 text-base text-foreground focus:outline-primary disabled:opacity-60";

function RelatedRecordLabel({
  resource,
  value,
}: {
  resource: string;
  value: string;
}) {
  const { token } = useAuth();
  const record = useResource<RecordData>(
    `${operationsPath(resource)}${encodeURIComponent(value)}/`,
    token,
  );
  return record.data
    ? recordLabel(record.data)
    : record.error
      ? `Record #${value} unavailable`
      : "Loading selection…";
}

export function RelatedPicker({
  field,
  value,
  onChange,
  park,
}: {
  field: FieldInfo;
  value: string;
  onChange: (value: string) => void;
  park?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<{
    value: string;
    label: string;
  } | null>(null);
  return (
    <VStack space="sm">
      <Text bold>
        {field.label}
        {field.required ? " *" : ""}
      </Text>
      <Button
        variant="outline"
        isDisabled={field.resource === "areas" && park === ""}
        onPress={() => setOpen(true)}
      >
        <ButtonText>
          {field.resource === "areas" && park === ""
            ? "Choose a park first"
            : selection?.value === value
            ? selection.label
            : value
              ? (
                <RelatedRecordLabel resource={field.resource!} value={value} />
              )
              : `Choose ${field.label.toLowerCase()}`}
        </ButtonText>
      </Button>
      {open && (
        <RelatedSearch
          field={field}
          park={park}
          close={() => setOpen(false)}
          select={(record, id) => {
            onChange(String(record[id]));
            setSelection({
              value: String(record[id]),
              label: recordLabel(record),
            });
            setOpen(false);
          }}
        />
      )}
    </VStack>
  );
}

function RelatedSearch({
  field,
  select,
  close,
  park,
}: {
  field: FieldInfo;
  select: (record: RecordData, id: string) => void;
  close: () => void;
  park?: string;
}) {
  const { token } = useAuth();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const path = operationsPath(field.resource!);
  const schema = useResource<Schema>(`${path}schema/`, token);
  const query = new URLSearchParams({
    search,
    ...(park ? { park_id: park } : {}),
  });
  const records = useResource<RecordPage>(`${path}?${query}`, token);
  return (
    <Modal isOpen onClose={close} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[85vh]">
        <ModalHeader>
          <Heading size="xl">Choose {field.label.toLowerCase()}</Heading>
        </ModalHeader>
        <ModalBody scrollEnabled>
          <VStack space="md">
            <Field
              label={`Search ${field.resource}`}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => setSearch(input.trim())}
              returnKeyType="search"
            />
            <Button variant="outline" onPress={() => setSearch(input.trim())}>
              <ButtonText>Search</ButtonText>
            </Button>
            <ErrorMessage
              error={records.error || schema.error}
              retry={() => {
                records.reload();
                schema.reload();
              }}
            />
            {records.loading && <Loading />}
            {schema.data &&
              records.data?.results.map((record) => (
                <Button
                  key={String(record[schema.data!.id_field])}
                  variant="ghost"
                  className="justify-start"
                  onPress={() => select(record, schema.data!.id_field)}
                >
                  <ButtonText>{recordLabel(record)}</ButtonText>
                </Button>
              ))}
            {records.data?.count === 0 && <Text>No matching records.</Text>}
            {!!records.data?.next && (
              <Text className="text-muted-foreground">
                Showing the first 25 matches. Refine your search.
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={close}>
            <ButtonText>Cancel</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function RecordEditor({
  resource,
  schema,
  record,
  close,
  saved,
}: {
  resource: string;
  schema: Schema;
  record?: RecordData;
  close: () => void;
  saved: () => void;
}) {
  const { token } = useAuth();
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, string | boolean | File>>(
    () =>
      Object.fromEntries(
        Object.entries(schema.fields)
          .filter(([, f]) => !f.read_only)
          .map(([name, f]) => [
            name,
            f.type === "boolean"
              ? Boolean(record?.[name] ?? f.default ?? false)
              : String(record?.[name] ?? f.default ?? ""),
          ]),
      ),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [discard, setDiscard] = useState(false);
  const readOnly = !!record && !schema.permissions.change;
  const change = (name: string, value: string | boolean | File) => {
    setValues((old) => ({
      ...old,
      [name]: value,
      ...(schema.fields[name]?.resource === "parks"
        ? Object.fromEntries(
            Object.entries(schema.fields)
              .filter(([, field]) => field.resource === "areas")
              .map(([area]) => [area, ""]),
          )
        : {}),
    }));
    setDirty(true);
  };
  const dismiss = () => {
    if (!busy) {
      if (dirty) setDiscard(true);
      else close();
    }
  };
  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const payload: Record<string, string | boolean | File | null> = {};
    for (const [name, field] of Object.entries(schema.fields)) {
      if (field.read_only || (record && field.immutable)) continue;
      const value = values[name];
      if (field.type === "image upload" && !(value instanceof File)) continue;
      if (
        value === "" &&
        !field.allow_blank &&
        !field.allow_null &&
        !field.required
      )
        continue;
      payload[name] = value === "" && field.allow_null ? null : value;
    }
    const multipart = Object.values(payload).some((v) => v instanceof File);
    const body = new FormData();
    if (multipart)
      Object.entries(payload).forEach(([key, value]) =>
        body.append(key, value instanceof File ? value : String(value ?? "")),
      );
    try {
      await api(
        operationsPath(resource) +
          (record ? `${record[schema.id_field]}/` : ""),
        token,
        {
          method: record ? "PATCH" : "POST",
          body: multipart ? body : JSON.stringify(payload),
        },
      );
      saved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const details =
    error instanceof ApiError &&
    error.details &&
    typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : {};
  return (
    <Modal isOpen onClose={dismiss} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[90vh]">
        <ModalHeader>
          <Heading size="xl">
            {readOnly
              ? "Record details"
              : record
                ? "Edit record"
                : `Add to ${resource}`}
          </Heading>
        </ModalHeader>
        <ModalBody scrollEnabled>
          {discard ? (
            <VStack space="md">
              <Heading size="lg">Discard your changes?</Heading>
              <Text>Your changes have not been saved.</Text>
              <Button variant="outline" onPress={() => setDiscard(false)}>
                <ButtonText>Keep editing</ButtonText>
              </Button>
              <Button variant="destructive" onPress={close}>
                <ButtonText>Discard changes</ButtonText>
              </Button>
            </VStack>
          ) : (
            <form
              ref={form}
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <VStack space="lg">
                {!readOnly && (
                  <Text className="text-muted-foreground">
                    Fields marked * are required.
                  </Text>
                )}
                {resource === "tickets" && (
                  <Text className="text-muted-foreground">
                    Position 0 is the account holder; 1–49 are guests. The owner
                    and position stay fixed after creation.
                  </Text>
                )}
                <ErrorMessage error={error} />
                {Object.entries(schema.fields)
                  .filter(([, f]) => readOnly || !f.read_only)
                  .map(([name, field]) => {
                    const label =
                      fieldLabel(name, field) +
                      (field.required && field.type !== "boolean" ? " *" : "");
                    const value = values[name];
                    const immutable = !!record && field.immutable;
                    const fieldError = details[name]
                      ? String(details[name])
                      : undefined;
                    return (
                      <Box key={name}>
                        {immutable || readOnly ? (
                          <VStack space="sm">
                            <Text bold>{fieldLabel(name, field)}</Text>
                            {field.type === "image upload" && record?.[name] ? (
                              <a
                                href={String(record[name])}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                View image
                              </a>
                            ) : (
                              <Text>
                                {field.resource && record?.[name] != null ? (
                                  <RelatedRecordLabel
                                    resource={field.resource}
                                    value={String(record[name])}
                                  />
                                ) : (
                                  fieldValue(record?.[name], field)
                                )}
                              </Text>
                            )}
                          </VStack>
                        ) : field.resource ? (
                          <RelatedPicker
                            field={{ ...field, label: fieldLabel(name, field) }}
                            value={String(value)}
                            onChange={(value) => change(name, value)}
                            park={
                              field.resource === "areas"
                                ? String(values.park_id || values.park || "")
                                : undefined
                            }
                          />
                        ) : field.type === "boolean" ? (
                          <Checkbox
                            value={name}
                            isChecked={Boolean(value)}
                            onChange={(checked) => change(name, checked)}
                            aria-label={label}
                          >
                            <CheckboxIndicator>
                              <CheckboxIcon as={CheckIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel>{label}</CheckboxLabel>
                          </Checkbox>
                        ) : field.choices ? (
                          <FormControl>
                            <FormControlLabel>
                              <FormControlLabelText>
                                {label}
                              </FormControlLabelText>
                            </FormControlLabel>
                            <Select
                              selectedValue={String(value)}
                              onValueChange={(value) => change(name, value)}
                            >
                              <SelectTrigger aria-label={label}>
                                <SelectInput
                                  placeholder={`Choose ${field.label.toLowerCase()}`}
                                  aria-label={label}
                                />
                              </SelectTrigger>
                              <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                  {field.choices.map((choice) => (
                                    <SelectItem
                                      key={String(choice.value)}
                                      value={String(choice.value)}
                                      label={choice.display_name}
                                    />
                                  ))}
                                </SelectContent>
                              </SelectPortal>
                            </Select>
                          </FormControl>
                        ) : ["date", "time", "image upload"].includes(
                            field.type,
                          ) ? (
                          <FormControl>
                            <FormControlLabel>
                              <FormControlLabelText nativeID={`edit-${name}`}>
                                {label}
                              </FormControlLabelText>
                            </FormControlLabel>
                            {field.type === "image upload" ? (
                              <>
                                {record?.[name] && (
                                  <a
                                    href={String(record[name])}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                  >
                                    View current image
                                  </a>
                                )}
                                <input
                                  aria-labelledby={`edit-${name}`}
                                  type="file"
                                  accept="image/*"
                                  className={inputClass}
                                  required={!record && field.required}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) change(name, file);
                                  }}
                                />
                              </>
                            ) : (
                              <input
                                aria-labelledby={`edit-${name}`}
                                type={field.type}
                                value={String(value)}
                                className={inputClass}
                                required={field.required}
                                onChange={(event) =>
                                  change(name, event.target.value)
                                }
                              />
                            )}
                          </FormControl>
                        ) : (
                          <Field
                            label={label}
                            value={String(value)}
                            onChangeText={(value) => change(name, value)}
                            className={
                              field.multiline ? "min-h-24 py-3" : undefined
                            }
                            error={fieldError}
                            multiline={field.multiline}
                            maxLength={field.max_length}
                            keyboardType={
                              ["integer", "decimal"].includes(field.type)
                                ? "decimal-pad"
                                : field.type === "email"
                                  ? "email-address"
                                  : "default"
                            }
                          />
                        )}
                        {fieldError &&
                          (field.resource ||
                            field.choices ||
                            [
                              "boolean",
                              "date",
                              "time",
                              "image upload",
                            ].includes(field.type)) && (
                            <Text className="text-destructive" role="alert">
                              {fieldError}
                            </Text>
                          )}
                      </Box>
                    );
                  })}
              </VStack>
            </form>
          )}
        </ModalBody>
        {!discard && (
          <ModalFooter>
            <Button variant="outline" isDisabled={busy} onPress={dismiss}>
              <ButtonText>{readOnly ? "Close" : "Cancel"}</ButtonText>
            </Button>
            {!readOnly && (
              <Button
                isDisabled={busy}
                onPress={() => form.current?.requestSubmit()}
              >
                <ButtonText>{busy ? "Saving…" : "Save changes"}</ButtonText>
              </Button>
            )}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

export function ConfirmAction({
  resource,
  id,
  label,
  kind,
  close,
  saved,
}: {
  resource: string;
  id: string;
  label: string;
  kind: "delete" | "admit";
  close: () => void;
  saved: () => void;
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [affected, setAffected] = useState<Affected | null>(null);
  const [checked, setChecked] = useState(kind === "admit");
  // Fetch the fresh server preview only when requested; no destructive action
  // is available until the user has reviewed the affected model counts.
  async function preview() {
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ affected: Affected }>(
        `${operationsPath(resource)}${id}/delete-preview/`,
        token,
      );
      setAffected(data.affected);
      setChecked(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await api(
        `${operationsPath(resource)}${id}/${kind === "admit" ? "admit/" : "?confirm=true"}`,
        token,
        { method: kind === "admit" ? "POST" : "DELETE" },
      );
      saved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) close();
      }}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="xl">
            {kind === "admit" ? "Admit visitor?" : "Delete this record?"}
          </Heading>
        </ModalHeader>
        <ModalBody>
          <VStack space="md">
            <Text bold>{label}</Text>
            <Text>
              {kind === "admit"
                ? "The server will check the ticket, booked time window and current ride availability. Admission cannot be undone here."
                : "Deletion also removes the related records listed below and cannot be undone."}
            </Text>
            <ErrorMessage error={error} />
            {affected?.map((item) => (
              <HStack key={item.model} className="justify-between">
                <Text>{item.label}</Text>
                <Text bold>{item.count}</Text>
              </HStack>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" isDisabled={busy} onPress={close}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          {checked ? (
            <Button
              variant={kind === "delete" ? "destructive" : "default"}
              isDisabled={busy}
              onPress={() => void confirm()}
            >
              <ButtonText>
                {busy
                  ? "Working…"
                  : kind === "delete"
                    ? "Delete records"
                    : "Confirm admission"}
              </ButtonText>
            </Button>
          ) : (
            <Button isDisabled={busy} onPress={() => void preview()}>
              <ButtonText>
                {busy ? "Checking…" : "Review affected records"}
              </ButtonText>
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
