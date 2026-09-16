# Reliability review

This is separate from the complexity-only ponytail report in `AUDIT.md`.

## Authentication and permissions

Fixed in the modernization branch:

- Public park/area/ride endpoints permitted anonymous writes. Public catalog reads
  now require staff status **and** the relevant Django model permission for writes.
- Employee endpoints accepted any authenticated user. Reads and writes now require
  their specific staff model permissions. Restaurant/store/product writes use the
  same policy as rides.
- Password reset returned its credential in JSON and revealed registered emails.
  Django's `PasswordResetForm` now sends the link only through email and the API
  returns the same successful response for known and unknown addresses.
- Sign-up now runs Django password validation; profile inputs reject future birth
  dates and invalid heights. ModelSerializer owns uniqueness and updates.
- A logout endpoint revokes the API token. Authentication endpoints have a basic
  anonymous request throttle (not a substitute for a production gateway).

Verification: `make check` passed with 14 tests, no system-check failures and no
migration drift. Regression coverage includes reset non-disclosure, weak password
and birth-date validation, token revocation, public write denial and model-specific
staff access. Existing restoration flows remain covered.

### Password changes and existing app sessions — 16 September

The Django reset confirmation previously changed the password while leaving the
DRF API token valid. The same gap affected password changes through Django admin.
`CustomUser.save()` now revokes the token when a stored password hash changes,
inside the same transaction as the password save. This also covers disabling a
password. Creation still issues the initial token, and ordinary profile edits
retain it. Password-hasher upgrades conservatively revoke an existing token too;
a successful login then issues a new one.

Login locks and rechecks the authenticated account before issuing a token, so
an intervening reset or account deactivation cannot issue a credential using stale
authentication results. Profile updates write only their submitted fields:
a reproduced in-flight profile save previously restored the old password hash
after a reset.

The app can now sign out when the server has already revoked its token. Other
logout failures remain visible. Unauthorized responses explain that the session
has ended and ask the visitor to sign out and sign in again.

Verification: all **62 backend tests**, including the file-backed SQLite
concurrency cases, pass; system and migration-drift checks pass. New regressions
cover reset/replay/weak-password behavior, admin changes, ordinary profile saves,
stale authentication and profile writes, and rollback if token revocation fails.
Seven frontend tests, type checking and lint pass. A synthetic visitor completed
the live Django reset with CSRF through an HTTP client; Pixel 10 then rejected the
old token, allowed sign-out and accepted the new password.

These guards apply to model saves; bulk updates and raw SQL bypass them. Change
passwords through Django's password forms or `set_password()` followed by `save()`.
SQLite is the verified database; PostgreSQL lock behavior has not been tested.
This is not a redesign of the remaining Django authentication templates.

## Reservation correctness

Booking rules now live on `RideReservation`, shared by the visitor API and Django
admin/model saves. Creation and rescheduling check future time, ticket date,
recorded visitor height, maintenance, duration/capacity, the full opening-hours
interval, overlapping reservations across rides and peak concurrent occupancy.
Adjacent bookings may share a boundary. An atomic batch rolls back if any visitor
fails; deleting a booking releases its seat. Client API fields for admission,
computed end time and generated code are read only.

The original end time survives status edits and later ride-duration changes.
Admitted reservations cannot be rescheduled. Malformed date/hour filters return
400 rather than producing database parsing failures.

Verification: all 22 Django tests pass against a temporary file-backed SQLite
database, including two simultaneous API connections competing for the last seat
(one 201, one 400, one stored reservation). CI uses a file-backed test database to
exercise real SQLite timeout/locking behavior. The ordinary in-memory test run
explicitly skips that one concurrency case; run with `DJANGO_TEST_DATABASE_PATH`
pointing to a disposable test path to include it. Row-locking database behavior
has not been exercised; SQLite remains the supported local database.

Newly seeded demo profiles include height. Existing profiles are preserved and
must supply missing height before booking a ride with a height restriction.

## Visit tickets and guest details

Visit creation and the existing Django booking page now call one transactional
service. Repeating a booking reuses the same party positions, ticket codes and
guest details. Reducing a party requires explicit confirmation with affected
ticket/reservation counts; admitted reservations prevent removal. Account locking
also covers two requests for a new visit with no existing ticket rows.

Guest updates cannot move a guest to another ticket. Height and age ranges are
validated. Malformed ticket date/guest ID filters return 400. The PNG QR endpoint
and its ticket/guest details are available only to the ticket owner.

Verification: 31 Django tests pass with a temporary file-backed SQLite database,
including concurrent repeat bookings, removal/cascade rules, API/web parity,
guest validation and QR ownership. No historical database or migration changed.

## Reservation availability, passes and cancellation

The booking-options API returns the owner's visitors, recorded-height eligibility,
half-hour start choices, remaining peak capacity and conflicts for the owner's
tickets. Other visitors' identities and ticket IDs are never returned. Its three
database queries cover the ride, party and relevant bookings; confirmation still
revalidates every rule inside the atomic booking transaction.

Reservation responses include park-time timestamps and display names. Owner-only
QR responses and ticket QR responses use `private, no-store`; missing historical
reservation codes return useful validation feedback. Cancelling locks the ticket,
ride and fresh reservation, rejects admitted/finished bookings and releases only
that visitor's seat. Missing historical dates remain intact and cannot be cancelled.
Out-of-range ride durations and the last calendar date cannot overflow slot generation.

Verification: 36 Django tests pass with a disposable file-backed SQLite database,
including the existing concurrency cases, availability query count, cross-ride
conflicts, visitor privacy, cancellation restrictions and QR ownership. Pixel
group booking, individual cancellation and QR evidence are in
[VERIFICATION.md](VERIFICATION.md). Staff admission and row-locking databases
still need their own verification.

## Still open

- Staff ticket/admission API permissions and atomic transitions are covered by
  the operations tests below. The complete browser admission workflow and
  row-locking database behavior remain to be verified.
- Tokens are long-lived and logout revokes all sessions sharing that user's token.
  Native SecureStore persistence is verified on Pixel 10; the web uses tab-lifetime
  sessionStorage. These do not change the server token's lifetime.
- Configure HTTPS, production hosts, secret key, email delivery and deployment
  request limits before public deployment. No production deployment is performed.
- Previously committed credentials/data remain in Git history. Local historical
  files are preserved and ignored. Credential rotation/history decisions belong
to the repository owner; this branch does not rewrite shared history.

## Ticket lookup and camera permissions

The former “ticket is valid” endpoint now identifies the owner's ticket and its
visit date/status. It performs no admission mutation. Unknown codes and another
account's codes return the same error; malformed inputs and duplicate historical
codes return 400. Results use `private, no-store`.

The gluestack scanner uses the already pinned Expo camera service, supports
manual input after permission denial and distinguishes today/future/past visits.
It unmounts the preview after scanning, on route blur or app backgrounding.
Pending lookups use the shared timeout and abort on blur. Input/scan submission
dismisses the keyboard so the result can use the phone viewport.

Verification: 38 backend tests, native permission/manual/camera walkthrough and
configuration introspection. The standalone configuration does not request
microphone recording. This does not establish physical-device scanner accuracy
or native release performance.

## Pending review tracks

Accessibility (including screen-reader/focus and contrast), performance and the
complete visual review remain pending. Foundation native evidence is recorded in
[VERIFICATION.md](VERIFICATION.md); it is not a whole-product audit.

## Operations groundwork — 15 September 2026

Profile responses now expose read-only staff status and Django model permissions.
Neither signup nor profile updates can grant staff/superuser status or permissions.
Catalog serializers run shared model validation on the complete proposed record,
including PATCH requests: park/area assignments, ride capacity/duration/height,
same-day venue hours, nonnegative product prices and employee dates. Overnight
employee shifts remain supported. Moving an area cannot strand its existing
rides, shops, restaurants or employees in another park. Existing stored records
and database schemas are unchanged; invalid legacy records need correction when
edited.

Catalog and employee API deletion uses Django's related-object collector. Staff
must hold delete permission for every affected model, and cascades require
explicit confirmation. Admitted or completed reservations prevent parent deletion
so operational history is retained. This is an API guard; the existing Django
admin fallback still uses its own permission and confirmation workflow.

Verification: 45 backend tests pass using a disposable file-backed SQLite
database, with no system-check errors or migration drift. The new regression
cases cover privilege escalation, partial edits, dependent-model deletion and
admitted history. The custom staff portal and its runtime walkthrough remain in
progress.

## Staff operations APIs

`/api/operations/` exposes only resources the staff member can view. Resource
lists, details and schemas require the matching model permission and return
`private, no-store`. Lists use bounded pagination and server-side search/filters.
Visitor account lookup is read only; neither the profile nor the portal grants
staff roles. Existing Django admin remains the account/group management fallback.

Staff ticket writes lock the account and ticket, reject duplicate party positions,
preserve owner/position and ticket codes, keep guest dates synchronized and reject
date changes while ride reservations exist. Creating a guest ticket also requires
guest-add permission. Guest removal goes through its ticket.

Reservation creation/rescheduling reuse the existing model rules. Admission is a
separate change-permission action with ticket → ride → reservation locking. It
checks today's visit, the complete booked time window, maintenance and recorded
height; repeated admission is idempotent. Admitted/completed reservations block
deletion, including deletion through a parent catalog record.

Regression coverage includes 54 backend tests on disposable file-backed SQLite:
permissions, metadata, search/filter/pagination, ticket identities/dates/codes,
guest cascades, image upload and nullable employee contacts, plus concurrent
admission. The final targeted catalog/operations run also passes after fresh-row
lookups were changed to return 404 when a concurrently removed record is missing.
No schema migration or historical database change is required.

## Frontend dependency review — 15 September 2026

The lockfile pins Expo 57.0.23, React Native 0.86.3, gluestack core 5.0.15,
UniWind 1.11.0 and Tailwind 4.3.2. Expo's version-alignment check passes.
UniWind/Tailwind's subsequent combination applied desktop media rules on Android;
keep this pair until an upstream fix is tested on the emulator.

This review's npm counts concern `frontend/` only. On the first feature-branch
push, GitHub reported **109 default-branch dependency alerts** (4 critical,
63 high, 33 moderate, 9 low). Legacy dependencies remain until migration parity
allows their removal. The replacement's audit gate does not establish that the
entire repository is free of vulnerable dependencies.

`npm audit` reports three moderate findings and no high/critical findings after a
scoped `xcode → uuid 11.1.1` override. The remaining decode-uri-component advisory
(GHSA-vcc3-ghjq-m6fr) is inherited through Expo Router's query-string dependency.
Its patched major changes module exports, so forcing that override is not proven
compatible. The audit gate fails at high severity; this moderate advisory remains
tracked, not suppressed or described as fixed.

The official copied Select includes Legend Motion, which pulls a NativeWind 4
peer with a Tailwind 3 peer warning. The active screens use UniWind; review/remove
unused generated components and their dependencies after the forms migration.
Do not accept a blind forced audit fix that downgrades Expo or its router.

Scanner CI initially failed when Expo's online compatibility recommendation
advanced to 57.0.23 during the work. The exact Expo and Babel preset pins were
updated to 57.0.23 / 57.0.12 after reviewing the published package diffs.
Compatibility, types, lint, tests, the audit gate and all platform exports pass
locally. The Pixel ticket layout still fits all three passes and the bottom
banner. The patch also contains iOS scene-life-cycle changes; these still need
the native iOS build/runtime verification tracked in the plan.
