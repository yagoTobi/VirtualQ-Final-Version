# VirtualQ modernization

Baseline: `566cdc5` on `main`. Work branch: `codex/virtualq-modernization`.
Foundation review: PR #2. Visitor workflow work continues on
`codex/virtualq-visitor-workflows` (PR #3), based on that foundation.
Reservations continue on the stacked `codex/virtualq-reservations` branch.
Ticket scanning continues on `codex/virtualq-ticket-scanner` (PR #5), based on reservations.
Persistent mobile navigation continues on `codex/virtualq-navigation`, based on scanning.
The restored Expo 48 client remains runnable until its replacement passes the
Android and web foundation gates. Django and its existing model identities stay.
The historical database is preserved locally; migrations run against the separate
`db.local.sqlite3`. Never migrate or seed the historical database in place.

## Scope and acceptance gates

| Milestone | Acceptance | Status |
| --- | --- | --- |
| Baseline | Clean checkpoint; inventory and plan committed | Recorded |
| Foundation | Pinned Expo/RN/gluestack v5; clean install; Android and web render shared controls; types pass | Runtime/build gates and CI passed |
| Visitor migration | Every real route below works with shared gluestack UI; responsive and accessible feedback | Accounts, visits, guests, plans, ride passes and scanner migrated; remaining web pages/checks pending |
| Operations | All management resources below have authorized search, forms, validation and confirmations | Implemented; complete browser coverage and narrow-layout checks pending |
| Reliability | Ownership, roles, capacity, overlaps, transactions and reset security regression tests pass | 65 backend tests pass; remaining audit tracks open |
| Product verification | Browser and Pixel 10 critical-flow walkthrough, mobile/desktop screenshots, build checks | Pixel/native binary and partial browser evidence recorded; full workflow matrix pending |
| Delivery | Small commits, reviewable PR, passing CI, setup/architecture/audit/maintenance docs | Stacked draft PRs and documentation maintained throughout; final delivery pending |

No milestone is complete on build evidence alone when runtime verification is
required. Physical-device and iOS simulator checks are reported separately.

## Architecture decision

Build the replacement in `frontend/`, with Expo, TypeScript, gluestack v5,
Tailwind v4 and UniWind. Visitor native/web and staff web share one component and
token layer. Django remains the API, permissions and persistence boundary.
Verify exact installed versions before declaring the foundation compatible.
Remove `userApp-React-Native/` only after functional parity is verified.

UniWind avoids a second CSS pipeline. Native navigation, safe-area/keyboard
integration, secure credential storage, camera access, date pickers and QR encoding are
documented platform exceptions; buttons, forms, cards, dialogs, text, layout and
feedback use the copied gluestack components. No invented component framework or
second staff-only UI library.

The date control uses Expo's supported native picker and the browser's date
input, with gluestack labels/buttons. QR PNGs come from Django's existing encoder.
Core 5.0.15's input ref declaration names props instead of the forwarded native
TextInput instance; the local copied input corrects that type boundary for
keyboard focus. Data requests refresh on route focus and abort on blur. Warm
refreshes retain the current screen’s data; URL/account changes hide it immediately.
Authorization/not-found responses discard retained private results.
The plans screen uses React Native's built-in FlatList in a non-scrolling page
container. No additional list library or speculative memoization was introduced.
The visitor header and bottom tabs live in one persistent layout. Each of the five
tabs has its own native stack; route groups preserve existing public URLs. Tabs
fade over 160 ms and details use the platform’s native stack transition, with
reduced motion respected. Ticket dates accept explicit route parameters and persist in the mounted tab;
links without a date retain the selection. Tab switches preserve mounted screens
and their selections. Account/profile history is protected after sign-out, and
Back at a tab root returns to Explore. The account card uses the global bottom
tabs instead of duplicate Tickets/Plans shortcuts. Completed/back actions dismiss to
the existing screen instead of adding duplicate list pages.
The compact next-plan banner refreshes when the active path changes and expires
finished reservations using a focus-scoped timer. Visitor selections and time slots use gluestack
Checkbox/Button, with server availability rechecked on confirmation.
Ticket scanning uses Expo Camera with a manual code fallback. The backend returns
the owner's pass and date classification; admission remains a staff operation.

Phone-first direction (confirmed by the user): the visitor experience is designed
and reviewed on a phone before desktop adaptation. Keep bottom navigation and the
explore/search panel. Use compact phone content, large touch targets and native
safe-area/keyboard behavior. The operations portal is a separate web layout.

Also apply the user-requested `react-native-best-practices` skill. Track native
render/bundle measurements in [PERFORMANCE.md](PERFORMANCE.md); optimize measured
problems and re-measure, keeping development traces separate from release metrics.

The user also requested a provisional map. Add a clearly labelled schematic park
map with tappable rides/areas and an accessible list alternative. It must not claim
GPS accuracy, walking directions or live location without real geographic data.

## Visitor route inventory

| Existing screen/page | Replacement purpose | Required behavior |
| --- | --- | --- |
| HomeScreen | Discover | Park summary, real rides, next visit and booking actions |
| LogInScreen / ticket login | Sign in | Validated credentials, useful failure, authenticated redirect |
| SignUpScreen | Create account | Validated fields and Django password policy |
| ResetPasswordRequestScreen | Recover account | Generic response; reset token only in email |
| Django reset confirm/complete | Set password | Same identity, accessible form/errors and return action |
| RidesListScreen | Rides | Search, type/area/status filters, loading/error/empty states |
| SearchScreen | Rides search | Real search results; merged with rides rather than blank destination |
| RideDetailScreen | Ride details | Local image, hours, height/accessibility, maintenance state |
| RideReservationScreen | Reserve | Valid ticket date/visitor/available time; server-validated confirmation |
| ReservationHubScreen | My plans | Chronological reservations, QR and confirmed cancellation |
| TicketHubScreen | Tickets | Admission codes by date/person, book visit action |
| Django book_visit | Book visit | Date and party size, atomic ticket creation, explicit reduction rules |
| TicketScanScreen | Scan ticket | Camera permission/error states and manual code fallback |
| UserScreen | Account | Profile, group, tickets, plans, sign out, authorized operations link |
| UserInfoScreen | Profile | Validated update with success/error state |
| GuestInformationScreen | Group | Own-ticket guest details; no foreign-ticket reassignment |

Unimplemented legacy destinations (`Visit`, `Itinerary`, `MapNavigationScreen`,
`Shops`, `Restaurants`, `QandA`, location footer) must not remain clickable
placeholders. Plans replaces itinerary and visit links. Discovery of shops and
restaurants can use existing catalog data. The provisional map replaces the broken
map destination; accurate geographic positioning and route planning require actual
coordinates and remain documented future features.

## UI/component inventory

Legacy: Header, Footer, Banner, PillButton, GridPanel, RideBanner,
ReservationBanner, SuccessBanner, FilterButton, FilterPanel, FilterModal,
AccesibilityInfo, DatePicker and DateTimePicker (native/web).

Replace these with shared page/navigation, gluestack Button/Input/FormControl,
Card, Badge, Select/Checkbox, Alert/Modal, Image, Heading/Text and stack/layout
primitives. Keep date inputs behind a platform adapter where needed. Consolidate
the duplicated avatar list into initials until usable avatar assets are supplied.
Remove external hero dependencies and duplicate hard-coded marketing banners.

Legacy runtime dependency inventory is checkpointed in
`userApp-React-Native/package.json` and its lockfile: Expo48/RN0.71/React18;
React Navigation; Paper; Animatable; Modal; swipe gestures; toast; two icon
families; date-fns; datetimepicker/picker; barcode scanner; QR/SVG; safe area;
gesture handler/screens; Expo constants; Webpack/RN Web. Replace through the
new pinned lockfile, then remove the obsolete client and duplicate UI packages.
Python dependencies are explicitly pinned in `requirements.txt`.

## Operations workflow inventory

| Resource | Existing model/API | Staff workflows |
| --- | --- | --- |
| Parks | ThemePark / parkRides | List/search/create/edit/delete with dependency confirmation |
| Areas | ThemeParkArea / parkRides | Park assignment, list/search/forms |
| Rides | ThemeParkRide / parkRides | Content/image, area/park, capacity/duration/hours/restrictions/accessibility |
| Maintenance | ThemeParkRide.under_maintenance | Status filtering and explicit enable/disable |
| Employees | ParkEmployee / employees | Identity/contact, assignment, role/shift dates and times |
| Restaurants | Restaurant / restaurants | Content/image, types, opening hours and assignment |
| Stores | Store / stores | Content/image, opening hours and assignment |
| Products | Product / stores | Store, content/image and nonnegative decimal price |
| Tickets | Ticket / tickets | User/date/party position; generated code remains read only |
| Guests | Guest / tickets | Ticket linkage, name/age/height; generated visit date read only |
| Reservations | RideReservation / queue | Search/filter, valid booking/edit/cancel and admission validation |
| Visitor accounts | CustomUser / operations | Read-only name/username/email lookup for visit assistance |

Employee records are not automatically authentication accounts. Django model
permissions control management access; `is_staff` alone must not authorize every
mutation. Superusers retain restricted `/admin/` fallback. Normal users may only
manage their own profile, tickets, guests and reservations. Public catalog reads
must never imply public writes.

## Audit tracks and verification record

Keep complexity findings in `AUDIT.md`, separate from correctness/security,
dependency, accessibility and performance evidence. Prioritize:

1. Public catalog writes, staff permissions and ownership on every mutation.
2. Password reset token disclosure and authentication input validation.
3. Reservation opening hours, future dates, overlap, capacity and atomic batches.
4. Guest/ticket date consistency, safe updates, cancellation and QR validation.
5. Dependency audit, duplicate vendor static files and obsolete/dead code.
6. Keyboard/focus, contrast, accessible labels, target sizes and responsive states.

Baseline checks: 11 Django tests, system check and no migration drift passed
during restoration. Browser login, booking, QR were exercised. Pixel 10 loaded
Expo48 and fetched rides; native login/booking were not exercised. Android/iOS
JavaScript exports passed; these are not native release builds.

Each subsequent implementation commit updates this record with actual commands,
results and limitations. Do not represent a pending or manual check as passed.

Foundation checkpoint (15 September): Expo 57.0.22 / RN 0.86.3 / gluestack core
5.0.15 / UniWind 1.11.0 / Tailwind 4.3.2. Clean install, types, lint, dependency
alignment and web/Android/iOS JS exports pass. Pixel 10 Explore/search, map
selection/detail navigation, keyboard-open sign-in, secure session restoration
and sign-out were exercised. Desktop web was visually inspected during initial
assembly; remaining forms and flow migration are still required. Evidence and
limitations: [VERIFICATION.md](VERIFICATION.md), [MOBILE_DESIGN.md](MOBILE_DESIGN.md).

## Operations checkpoint

15 September: `/operations` is a separate web workspace
using the shared gluestack components and semantic tokens. Its server APIs cover
the inventory above with paginated search/filtering, model permissions, form
metadata, confirmation previews and atomic admission. The visitor app retains
native tabs and detail transitions. Browser-specific modal primitives avoid a
Safari exit-animation hang; authentication wraps the gluestack overlay host so
nested dialogs retain the session.

The common staff sign-in, create/validation/discard/save flow and authenticated
relationship picker were exercised in Safari. Pixel session restoration,
Explore, map and retained ticket selection were rechecked. There are 54 passing
backend tests and six frontend tests. Full row-edit/delete/admission browser
coverage, smaller web layouts, the legacy Django pages and the remaining audit
tracks are still required; this checkpoint does not close the full objective.

Recovery checkpoint (16 September): email links and legacy Django confirmation
links now reach the shared gluestack password form. The installed Android app
preserves recovery fragments through its native-intent hook. Sign-in, sign-up
and both recovery screens use full-width native panels with a bounded web card.
65 backend tests and nine frontend tests pass, as do types, lint and all three
JavaScript exports. Pixel cold-link/form/keyboard and used-link navigation checks
passed; submission was tested through HTTP. Desktop, success-screen and
accessibility coverage remain open, along with the other Django page migrations.
See [verification evidence](VERIFICATION.md).

Visitor web entry checkpoint (16 September): old booking and ticket-login GET
and HEAD links redirect to the shared app's protected booking screen. Previously
opened Django forms retain their POST behavior until browser parity is verified.
67 backend tests pass, including trusted-origin redirects, no-cache responses,
legacy authentication and the existing booking/reduction rules. Live HTTP checks
reach the frontend HTML; this does not establish browser interaction parity.

## Git and data handling

The installed-app walkthrough continued on
`codex/virtualq-mobile-flow-feedback`, based on recovery PR #14. It found and
fixed guest-save feedback and map-origin reservation completion. Sign-in,
profile/group updates, booking, QR display and cancellation were exercised with
a disposable visitor; the visitor and all attached test data were removed.
Native screenshots, the reproduced navigation failure and remaining checks are
recorded in [VERIFICATION.md](VERIFICATION.md).

Use descriptive commits on the feature branch, review diffs before staging and
push without force. Open a PR with test evidence and screenshots, then check CI.
Keep main releasable and do not merge without the intended review step.

Historical `.env` and `db.sqlite3` were already tracked in baseline history.
Stop tracking them without deleting local files. This does not remove historical
copies: the repository owner must rotate exposed credentials and decide on any
separate history remediation. Do not print credentials or copy private records
into fixtures, screenshots, docs or new commits.
