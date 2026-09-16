import { createContext, useContext, useState } from "react";
import { Link, Slot, useLocalSearchParams, usePathname } from "expo-router";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";
import {
  OperationsIndex,
  Resource,
  Schema,
  RecordData,
  RecordPage,
  fieldLabel,
  fieldValue,
  recordLabel,
  operationsPath,
} from "@/lib/operations";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Field } from "@/components/field";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableData,
  TableCaption,
} from "@/components/ui/table/index.web";
import { ConfirmAction, RecordEditor, RelatedPicker } from "./form.web";

const OperationsContext = createContext<{
  data: OperationsIndex | null;
  reload: () => void;
}>({ data: null, reload: () => {} });
const navClass =
  "flex min-h-11 items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary";

export function OperationsShell() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading label="Restoring your session…" />;
  if (!user) return <StaffSignIn />;
  if (!user.is_staff)
    return (
      <VStack space="lg" className="m-auto w-full max-w-lg p-8">
        <Heading size="3xl">Staff access required</Heading>
        <Text>This account does not have access to park operations.</Text>
        <Link href="/" className="text-primary underline">
          Return to the visitor app
        </Link>
        <SignOut />
      </VStack>
    );
  return <Workspace />;
}

function StaffSignIn() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const login = await api<{ token: string }>("/api/clients/login/", null, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await signIn(login.token);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md gap-6 p-8">
        <Text className="font-bold uppercase tracking-widest text-primary">
          VirtualQ · Operations
        </Text>
        <Heading size="3xl">A great park day starts here.</Heading>
        <Text className="text-muted-foreground">
          Sign in with your staff account to manage the park and help visitors.
        </Text>
        <Field
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoComplete="username"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={() => void submit()}
        />
        <ErrorMessage error={error} />
        <Button
          isDisabled={busy || !username || !password}
          onPress={() => void submit()}
        >
          <ButtonText>
            {busy ? "Signing in…" : "Sign in to operations"}
          </ButtonText>
        </Button>
        <Link href="/" className="text-center text-primary underline">
          Back to the visitor app
        </Link>
      </Card>
    </Box>
  );
}

function SignOut() {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  return (
    <VStack space="sm">
      <ErrorMessage error={error} />
      <Button
        variant="outline"
        isDisabled={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await signOut();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ButtonText>{busy ? "Signing out…" : "Sign out"}</ButtonText>
      </Button>
    </VStack>
  );
}

function Workspace() {
  const { user, token } = useAuth();
  const index = useResource<OperationsIndex>("/api/operations/", token);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <OperationsContext.Provider
      value={{ data: index.data, reload: index.reload }}
    >
      <Box className="min-h-screen bg-background lg:flex-row">
        <a
          href="#operations-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-4"
        >
          Skip to workspace
        </a>
        <Box className="border-b border-border bg-card p-4 lg:hidden">
          <HStack className="items-center justify-between">
            <Text bold>VirtualQ · Operations</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
            >
              <ButtonText>{menuOpen ? "Close menu" : "Menu"}</ButtonText>
            </Button>
          </HStack>
        </Box>
        <Box
          className={`${menuOpen ? "block" : "hidden"} w-full shrink-0 border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col`}
        >
          <VStack space="sm" className="p-6">
            <Text className="text-2xl font-bold tracking-tight text-primary">
              VirtualQ<span className="text-foreground">.</span>
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Park operations
            </Text>
          </VStack>
          <nav
            aria-label="Staff navigation"
            className="flex-1 overflow-y-auto px-3 pb-6"
          >
            <Link
              href="/operations"
              className={`${navClass} ${pathname === "/operations" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}
              onPress={() => setMenuOpen(false)}
            >
              Overview
            </Link>
            <Text className="px-4 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </Text>
            {index.data?.resources.map((resource) => (
              <Link
                key={resource.key}
                href={`/operations/${resource.key}`}
                onPress={() => setMenuOpen(false)}
                className={`${navClass} ${pathname === `/operations/${resource.key}` ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}
              >
                {resource.label}
                <span className="text-xs opacity-80">{resource.count}</span>
              </Link>
            ))}
          </nav>
          <VStack space="md" className="border-t border-border p-5">
            <Text bold>{user?.name || user?.username}</Text>
            <Link href="/" className="text-sm text-primary underline">
              Open visitor app
            </Link>
            <a
              href={`${API_URL}/admin/`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground underline"
            >
              Django admin fallback
            </a>
            <SignOut />
          </VStack>
        </Box>
        <main
          id="operations-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-5 focus:outline-none md:p-8 xl:p-10"
        >
          <Box className="mx-auto w-full max-w-7xl">
            <HStack className="mb-8 items-center justify-between border-b border-border pb-5">
              <Text className="text-sm text-muted-foreground">
                VirtualQ / Staff workspace
              </Text>
              <Text className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                {index.data?.time_zone || "Park time"}
              </Text>
            </HStack>
            <ErrorMessage error={index.error} retry={index.reload} />
            {index.loading ? (
              <Loading label="Loading your workspace…" />
            ) : (
              <Slot />
            )}
          </Box>
        </main>
      </Box>
    </OperationsContext.Provider>
  );
}

export function OperationsOverview() {
  const { data } = useContext(OperationsContext);
  return (
    <VStack space="2xl">
      <VStack space="sm">
        <Text className="text-sm font-bold uppercase tracking-widest text-primary">
          Your park, at a glance
        </Text>
        <Heading size="4xl">Make every visit a great one.</Heading>
        <Text className="max-w-2xl text-muted-foreground">
          Keep attractions ready, look after your team, and help visitors get
          more from their day.
        </Text>
      </VStack>
      {!data?.resources.length ? (
        <Card>
          <Heading size="xl">Your workspace is ready for access</Heading>
          <Text>
            Ask your administrator to assign the model permissions needed for
            your role.
          </Text>
        </Card>
      ) : (
        <Box className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.resources.map((resource) => (
            <Card key={resource.key} className="gap-5 p-6">
              <HStack className="items-center justify-between">
                <Heading size="xl">{resource.label}</Heading>
                <Text className="text-3xl font-bold text-primary">
                  {resource.count}
                </Text>
              </HStack>
              <Text className="min-h-12 text-sm text-muted-foreground">
                {resource.description}
              </Text>
              <Link
                href={`/operations/${resource.key}`}
                className="text-sm font-semibold text-primary underline"
              >
                Manage {resource.label.toLowerCase()} →
              </Link>
            </Card>
          ))}
        </Box>
      )}
    </VStack>
  );
}

export function OperationsResource() {
  const { resource: param } = useLocalSearchParams<{ resource: string }>();
  const { data } = useContext(OperationsContext);
  const resource = data?.resources.find((item) => item.key === param);
  if (!resource)
    return (
      <VStack space="md">
        <Heading size="3xl">Workspace unavailable</Heading>
        <Text>
          This resource does not exist or is not available to your role.
        </Text>
        <Link href="/operations">Return to overview</Link>
      </VStack>
    );
  return <ResourceListing key={resource.key} resource={resource} />;
}

function ResourceListing({ resource }: { resource: Resource }) {
  const { token } = useAuth();
  const index = useContext(OperationsContext);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<RecordData | "new" | null>(null);
  const [action, setAction] = useState<{
    record: RecordData;
    kind: "delete" | "admit";
  } | null>(null);
  const [notice, setNotice] = useState("");
  const path = operationsPath(resource.key);
  const schema = useResource<Schema>(`${path}schema/`, token);
  const query = new URLSearchParams({ ...applied, page: String(page) });
  const listing = useResource<RecordPage>(`${path}?${query}`, token);
  function refreshed() {
    setEditor(null);
    setAction(null);
    setNotice("Changes saved.");
    listing.reload();
    index.reload();
  }
  function apply() {
    setPage(1);
    setApplied(
      Object.fromEntries(
        Object.entries({ ...filters, search: search.trim() }).filter(
          ([, value]) => value,
        ),
      ),
    );
  }
  return (
    <VStack space="xl">
      <HStack className="flex-wrap items-start justify-between gap-4">
        <VStack space="sm">
          <Heading size="4xl">{resource.label}</Heading>
          <Text className="max-w-2xl text-muted-foreground">
            {resource.description}
          </Text>
        </VStack>
        {schema.data?.permissions.add && (
          <Button onPress={() => setEditor("new")}>
            <ButtonText>Add record</ButtonText>
          </Button>
        )}
      </HStack>
      {notice && (
        <Text
          role="status"
          className="rounded-lg bg-secondary p-4 text-secondary-foreground"
        >
          {notice}
        </Text>
      )}
      <Card className="gap-5 p-5">
        <HStack className="flex-wrap items-end gap-3">
          <Box className="min-w-48 flex-1">
            <Field
              label={`Search ${resource.label.toLowerCase()}`}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={apply}
              returnKeyType="search"
            />
          </Box>
          <Button onPress={apply}>
            <ButtonText>Search</ButtonText>
          </Button>
          {!!schema.data?.filters.length && (
            <Button
              variant="outline"
              onPress={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
            >
              <ButtonText>
                Filters{" "}
                {Object.keys(applied).filter((key) => key !== "search")
                  .length || ""}
              </ButtonText>
            </Button>
          )}
          {!!Object.keys(applied).length && (
            <Button
              variant="ghost"
              onPress={() => {
                setSearch("");
                setFilters({});
                setApplied({});
                setPage(1);
              }}
            >
              <ButtonText>Clear</ButtonText>
            </Button>
          )}
        </HStack>
        {filtersOpen && schema.data && (
          <VStack space="md">
            <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schema.data.filters.map((name) => {
                const field = schema.data!.fields[name];
                if (!field) return null;
                const label = fieldLabel(name, field);
                const change = (value: string) =>
                  setFilters((old) => ({ ...old, [name]: value }));
                return (
                  <Box key={name}>
                    {field.resource ? (
                      <RelatedPicker
                        field={{ ...field, label, required: false }}
                        value={filters[name] || ""}
                        onChange={change}
                      />
                    ) : (
                      <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                        {label}
                        {field.type === "boolean" || field.choices ? (
                          <select
                            value={filters[name] || ""}
                            onChange={(event) => change(event.target.value)}
                            className="min-h-12 rounded-md border border-input bg-card px-3 text-foreground focus:outline-primary"
                          >
                            <option value="">Any</option>
                            {(
                              field.choices || [
                                { value: "true", display_name: "Yes" },
                                { value: "false", display_name: "No" },
                              ]
                            ).map((choice) => (
                              <option
                                key={String(choice.value)}
                                value={String(choice.value)}
                              >
                                {choice.display_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === "date" ? "date" : "number"}
                            value={filters[name] || ""}
                            onChange={(event) => change(event.target.value)}
                            className="min-h-12 rounded-md border border-input bg-card px-3 text-foreground focus:outline-primary"
                          />
                        )}
                      </label>
                    )}
                  </Box>
                );
              })}
            </Box>
            <Button variant="outline" onPress={apply}>
              <ButtonText>Apply filters</ButtonText>
            </Button>
          </VStack>
        )}
      </Card>
      <ErrorMessage
        error={schema.error || listing.error}
        retry={() => {
          schema.reload();
          listing.reload();
        }}
      />
      {listing.loading || schema.loading ? (
        <Loading label={`Loading ${resource.label.toLowerCase()}…`} />
      ) : (
        schema.data &&
        listing.data && (
          <>
            <HStack className="items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                {listing.data.count}{" "}
                {listing.data.count === 1 ? "record" : "records"}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                isDisabled={listing.refreshing}
                onPress={listing.reload}
              >
                <ButtonText>
                  {listing.refreshing ? "Refreshing…" : "Refresh"}
                </ButtonText>
              </Button>
            </HStack>
            {!listing.data.count ? (
              <Card className="items-center gap-3 py-12">
                <Heading size="xl">No records found</Heading>
                <Text className="text-muted-foreground">
                  Try another search or clear your filters.
                </Text>
              </Card>
            ) : (
              <Box className="overflow-x-auto rounded-xl border border-border bg-card">
                <Table>
                  <TableCaption>
                    {resource.label} matching your current search and filters
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      {schema.data.columns.map((name) => (
                        <TableHead key={name}>
                          {fieldLabel(name, schema.data!.fields[name])}
                        </TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listing.data.results.map((record) => (
                      <TableRow key={String(record[schema.data!.id_field])}>
                        {schema.data!.columns.map((name, i) => (
                          <TableData key={name}>
                            {typeof record[name] === "boolean" ? (
                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                                  name === "under_maintenance"
                                    ? record[name]
                                      ? "bg-highlight text-foreground"
                                      : "bg-secondary text-secondary-foreground"
                                    : record[name]
                                      ? "bg-secondary text-secondary-foreground"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {name === "under_maintenance"
                                  ? record[name]
                                    ? "Maintenance"
                                    : "Available"
                                  : name === "validated"
                                    ? record[name]
                                      ? "Admitted"
                                      : "Reserved"
                                    : record[name]
                                      ? "Yes"
                                      : "No"}
                              </span>
                            ) : (
                              <span className={i === 0 ? "font-semibold" : ""}>
                                {fieldValue(
                                  record[name],
                                  schema.data!.fields[name],
                                )}
                              </span>
                            )}
                          </TableData>
                        ))}
                        <TableData>
                          <HStack className="gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onPress={() => setEditor(record)}
                            >
                              <ButtonText>
                                {schema.data!.permissions.change
                                  ? "Edit"
                                  : "View"}
                              </ButtonText>
                            </Button>
                            {resource.key === "reservations" &&
                              !record.validated &&
                              schema.data!.permissions.change && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onPress={() =>
                                    setAction({ record, kind: "admit" })
                                  }
                                >
                                  <ButtonText>Admit</ButtonText>
                                </Button>
                              )}
                            {schema.data!.permissions.delete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onPress={() =>
                                  setAction({ record, kind: "delete" })
                                }
                                aria-label={`Delete ${recordLabel(record)}`}
                              >
                                <ButtonText className="text-destructive">
                                  Delete
                                </ButtonText>
                              </Button>
                            )}
                          </HStack>
                        </TableData>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            <HStack className="items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                Page {page} of {Math.max(1, Math.ceil(listing.data.count / 25))}
              </Text>
              <HStack space="sm">
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={!listing.data.previous}
                  onPress={() => setPage(page - 1)}
                >
                  <ButtonText>Previous</ButtonText>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isDisabled={!listing.data.next}
                  onPress={() => setPage(page + 1)}
                >
                  <ButtonText>Next</ButtonText>
                </Button>
              </HStack>
            </HStack>
          </>
        )
      )}
      {editor && schema.data && (
        <RecordEditor
          resource={resource.key}
          schema={schema.data}
          record={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
          saved={refreshed}
        />
      )}
      {action && schema.data && (
        <ConfirmAction
          resource={resource.key}
          id={String(action.record[schema.data.id_field])}
          label={recordLabel(action.record)}
          kind={action.kind}
          close={() => setAction(null)}
          saved={refreshed}
        />
      )}
    </VStack>
  );
}
