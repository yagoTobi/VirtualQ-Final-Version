# Product verification

## Foundation — 15 September 2026

Environment: Pixel 10 Android Studio emulator, Android 17 / API 37, arm64,
1080 × 2424 px, density 420; Expo Go 57.0.9. Local Django demo data only.
Native screenshots and taps used ADB after the computer-control tool could not
attach to the emulator window.

Verified on the actual emulator:

- Explore loads real API ride names, local images and maintenance status.
- Search for “Python” reduces the list to Python Plunge.
- Bottom navigation reaches the provisional map and account screen.
- Map pin 2 selects Java Jamboree; its details action opens that ride.
- Sign in as the demo visitor with the software keyboard open. Both fields and
  the submit action remain visible, and the bottom tabs yield space to the keyboard.
- Successful authentication closes the keyboard and displays the demo profile.
- Force-stop and reopen Expo Go: the saved secure token restores the demo session.
- Sign out returns to Explore with the unauthenticated header.

Screenshots use seeded demo data. The floating gear is Expo Go's development
overlay. These are runtime captures, not design mockups:

| Explore | Sign in with keyboard | Restored account |
| --- | --- | --- |
| ![Explore](verification/android-explore.png) | ![Keyboard](verification/android-keyboard.png) | ![Account](verification/android-account.png) |

| Provisional map | Compact ride details |
| --- | --- |
| ![Map](verification/android-map.png) | ![Ride](verification/android-detail.png) |

The first native renders revealed a responsive compiler regression in
UniWind 1.12.0 / Tailwind 4.3.3. The pinned UniWind 1.11.0 / Tailwind 4.3.2
combination renders the phone layout correctly. The map also exposed an
unnecessary clipped decorative label; it was removed. The large ride-detail
image/title were reduced after visual inspection. A fresh Metro restart and
native walkthrough verified the corrected map, its detail link and the compact
ride page at `247ddfc`; screenshots above show that final sizing.

Automated foundation checks: clean `npm ci`, TypeScript, ESLint and
`expo install --check` pass. Web static export passes (seven routes; 1.7 MB JS,
42 KB CSS); Android/iOS Hermes exports pass (3.6/3.3 MB). These are JavaScript
exports, not native binary builds. Source checks now exclude generated exports:
the first parallel export/typecheck exposed a stale generated-file inclusion.
The scoped xcode UUID override generated 100 unique valid project identifiers.
The npm high-severity audit gate passes with three tracked moderate findings.
Draft PR: [#2](https://github.com/yagoTobi/VirtualQ-Final-Version/pull/2).
GitGuardian scanned the initial four commits without finding new secrets.
GitHub rejected the first workflow before running jobs because `runner.temp` was
used in job-level `env`, where the runner context is unavailable. The test path is
now set at step scope. The corrected push and PR runs passed at `c4b68f9`
([PR run](https://github.com/yagoTobi/VirtualQ-Final-Version/actions/runs/34939340782)),
including all 22 backend tests, clean npm install, types/lint, dependency alignment,
the high-severity audit gate and web/Android/iOS exports.

The shared HTTP client now combines screen cancellation with its own timeout;
previously supplying a screen signal bypassed the timeout. Two Node regression
tests cover both abort paths, an already-cancelled request, authentication headers,
structured API errors and empty cancellation responses. These use the actual
TypeScript client with mocked platform imports/network and add no test dependency.
The push and PR runs also pass at `247ddfc`, including these request tests
([PR run](https://github.com/yagoTobi/VirtualQ-Final-Version/actions/runs/34939801521)).

## Visitor accounts and tickets — 15 September 2026

On the same Pixel emulator, using a newly created synthetic local QA account:

- Registered, reached the account screen and restored the session after restarting.
- Opened Gboard on the long registration form. Shared page-level keyboard
  avoidance makes the final fields and Create account button reachable; bottom
  navigation yields the keyboard space.
- Selected September 16 in the native date picker and booked two additional
  guests. All three passes appear in the compact ticket list without scrolling.
- Reopened the visit with two guests prefilled and saved it again. The group
  remained intact. Attempting to reduce it showed explicit removal/cancellation
  counts; “Keep current group” returned to all three passes.
- Displayed a guest QR and edited the guest's name, age and height. The refreshed
  pass showed the new name. A separate read of this QA record confirmed persistence.
- Decoded the actual screenshot's QR with macOS Vision and compared its payload
  to that QA guest's stored ticket code. They match. This verifies the displayed
  QR; it is not a camera-scanner walkthrough.
- Updated the account holder's height and verified persistence.
- Signed out and submitted a reset request. The UI displayed the generic inbox
  confirmation. Local Django uses console email; production delivery was not tested.
- Submitted the sign-in username through an Android editor key event. Focus moved
  to Password through the native ref. The full registration “Next” sequence remains
  part of the broader keyboard/accessibility pass.

| Registration with Gboard | Compact tickets |
| --- | --- |
| ![Registration keyboard](verification/android-signup-keyboard.png) | ![Tickets](verification/android-tickets.png) |

| Guest pass before editing | Reset request confirmation |
| --- | --- |
| ![QR pass](verification/android-ticket-qr.png) | ![Reset request](verification/android-reset.png) |

The screenshots contain synthetic local data only. Native date picking uses
Expo's pinned `@react-native-community/datetimepicker` 9.1.0. Web uses the browser's
date input with gluestack labels. TypeScript, lint and two shared HTTP regression
tests pass. The visitor web export now contains thirteen routes (1.8 MB JS,
42 KB CSS); Android/iOS JavaScript exports passed earlier in this workflow pass.
CI must verify the final commit again after the last form refinements.
Desktop interaction verification is pending: computer control could not attach to
Zen (`cgWindowNotFound`) or Safari (`timeoutReached`) in this pass. Build/export
success does not substitute for that walkthrough.

The RN performance skill and development profiling results are recorded in
[PERFORMANCE.md](PERFORMANCE.md). No release FPS/TTI improvement is claimed.

## Initial reservation regression pass

All 22 backend tests pass with `DJANGO_TEST_DATABASE_PATH` set to a fresh temporary
SQLite file. Coverage now includes opening/closing boundaries, same-day past
times, absent height, cross-ride overlap, adjacent intervals, peak occupancy,
batch rollback, released capacity, rescheduling, admission fields, preserved
duration and malformed filters. Two concurrent connections competing for one seat
produce exactly one successful booking. This is API/database evidence; native
reservation forms still need migration and the subsequent walkthrough.

## Native ride reservations — 15 September 2026

On the same Pixel 10 / Expo Go environment, with the synthetic QA party:

- Chose the account holder and one height-eligible guest for Python Plunge on
  September 16 at 10:00. A guest without the required recorded height was
  disabled, with a reason and a details action.
- Reviewed names, date, start/end time and park time zone before confirming.
  Confirmation produced two separate passes in the compact Plans list.
- Opened the account holder's ride QR. macOS Vision decoded the actual screenshot,
  and the result matched that QA reservation's stored code.
- Opened cancellation, chose “Keep reservation”, then reopened it and confirmed.
  Only the account holder's reservation disappeared; the guest's pass remained.
- Opened Explore's next-plan banner before and after cancellation. Its action
  first opened the account holder's pass, then the remaining guest's pass after
  the screen refocused. The five bottom destinations remain visible and usable.
- Restarted Metro and Expo Go with the final UI refinements. Native accessibility
  labels now identify visitors by name and party position instead of ticket IDs.
  Selecting the already-booked guest disables 10:00 while adjacent choices remain
  available. The other guest remains disabled for missing height.

| Visitor eligibility and conflict | Review before booking |
| --- | --- |
| ![Eligibility](verification/android-reservation-conflict.png) | ![Review](verification/android-reservation-review.png) |

| Compact plans | Ride QR |
| --- | --- |
| ![Plans](verification/android-plans.png) | ![Ride QR](verification/android-reservation-qr.png) |

| Individual cancellation | Dynamic bottom banner |
| --- | --- |
| ![Cancellation](verification/android-reservation-cancel.png) | ![Next plan](verification/android-next-plan.png) |

All captures contain synthetic local QA data. The QR shown above was subsequently
cancelled. The floating gear belongs to Expo Go, not VirtualQ.

Automated checks: 36 Django tests pass on a disposable file-backed SQLite database;
three frontend request/navigation tests, type checking and lint pass. The added
API tests cover availability capacity/conflicts, recorded-height eligibility,
three view queries, privacy, past-time/maintenance filtering, admitted/finished
cancellation restrictions, QR ownership and calendar/duration overflow.
The final overflow regression was also rerun after strengthening its last-date
case; migration drift is absent.

Web export passes with sixteen routes (1.8 MB JS + 42 KB CSS); Android/iOS Hermes
exports pass at 3.7/3.4 MB. CI must recheck the committed final refinements. These
are JavaScript exports, not native binary builds. Desktop browser interaction
remains pending; computer control still reports no attached browser provider.

The reservation push and PR CI runs both passed at `d5082a5`, including
GitGuardian: [PR #4](https://github.com/yagoTobi/VirtualQ-Final-Version/pull/4),
[PR run](https://github.com/yagoTobi/VirtualQ-Final-Version/actions/runs/34952801376).

## Ticket scanner — 15 September 2026

Verified on the Pixel 10 using Expo Go and the same synthetic QA account:

- Declined camera permission and used manual entry. An unknown code produced
  a useful error; the guest's code found Alex's September 16 ticket and explicitly
  identified it as a future visit.
- Inspected the final permission-denied feedback and manual fallback on the phone.
- Granted one-time camera permission. The final version opens the preview
  immediately; the first implementation incorrectly needed a second tap because
  Android's permission dialog temporarily changed app foreground state.
- Scanned the synthetic QR through the native camera callback. Django received
  one successful lookup, the camera closed, and the screen displayed the matching
  guest and date. “Open this pass” reached that guest's existing QR/details page.
- Native configuration introspection includes camera permission and omits iOS
  microphone permission and Android audio recording permission. Expo Go displays
  its own host permission text; standalone binary permissions remain build checks.
- Reopened Tickets after restoring the normal emulator camera. All three party
  passes, the scanner entry and the next-plan banner fit in the Pixel viewport.

| Camera declined, manual entry available | Result from native camera scan |
| --- | --- |
| ![Denied permission](verification/android-scanner-denied.png) | ![Scanned ticket](verification/android-scanner-result.png) |

![Tickets with scanner entry and next-plan banner](verification/android-tickets-scanner.png)

The camera test used the Android emulator's documented
`-camera-back imagefile:/absolute/path/to/qa.png -no-snapshot` option. The ordinary
virtual scene showed a calibration pattern. A 1024 × 1024 RGB image with a
296 × 296 synthetic QR at (150, 364) placed the code inside this emulator's cropped
camera frame. This was image input to the native camera, not an injected JavaScript
barcode event. The automation helper timed out while capturing the successful
transition; the subsequent API log and inspected screenshot confirmed the result.
Afterward the device was restarted without the camera override. No AVD camera
configuration, historical database or real visitor record changed.

All 38 Django tests pass on file-backed SQLite, including date classification,
malformed/ambiguous codes, private responses and indistinguishable foreign/unknown
ticket errors. Types, lint and three frontend tests pass. Exports pass: seventeen
web routes (1.8 MB main JS, 45 KB additional JS, 43 KB CSS), Android/iOS Hermes
3.7/3.4 MB. No physical camera, iOS runtime or desktop camera walkthrough is claimed.

The scanner's initial CI passed types, tests and lint but failed Expo's online
version check after Expo 57.0.23 was published. The project now pins that patch
and Babel preset 57.0.12. Local compatibility/audit gates and all platform exports
pass again; a fresh Metro/Expo Go launch visually confirmed the compact Tickets
layout. Android's Hermes bundle hash is unchanged by this patch. Native iOS
scene-life-cycle changes are not verified by an iOS JavaScript export.
The scanner push and PR checks, including GitGuardian, pass at `6be6885` (PR #5).

## Persistent mobile navigation — 15 September 2026

The Pixel 10 check reproduced two issues in the original navigation: tab changes
slid duplicate headers/bottom controls across each other, and Tickets reset
September 16 to September 15 on a roundtrip. The revised layout keeps one header,
bottom bar and next-plan component, with a native stack for each tab and a short
160 ms tab fade.

Verified with the synthetic QA account:

- Tickets → Park map → Explore → Plans → Tickets retained September 16 and all
  three passes. A date manually changed to September 17 also survived a Map
  roundtrip. Both dates are future visits relative to September 15.
- Opening a park pass, returning to the group, opening/backing out of visit
  booking and opening/cancelling profile editing reached the expected screens.
- Returning from the scanner retains the selected date and passes, even when
  the back link omits date parameters. Choosing September 17 in the visit form
  and returning explicitly updated the existing Tickets tab; selecting September
  16 again restored the three passes.
- Leaving an open pass for Map and returning to Tickets reopened the same pass.
  Pressing the active Tickets tab again returned to the existing group/date.
  Map pin 2 and the Java search also survived navigation; the search was cleared
  after verification.
- Repeated sign-out/sign-in returned to Tickets. Native keyboard submission and
  the form button closed the keyboard and restored the five bottom tabs and
  next-plan banner. Android reported `mInputShown=false` after submission.
- After visiting Account and signing out, Android Back from the Tickets sign-in
  prompt returned to Explore. Protected account/profile history no longer sends
  the visitor back into sign-in. Stored authentication was restored on a fresh
  Expo Go launch.
- Android's animation scale was toggled from 1.0 to 0 with React DevTools
  connected. The mounted stack's reduced-motion context changed false → true,
  then back to false when 1.0 was restored. No reload was required.

| Phone tickets and persistent bottom controls | Compact account panel |
| --- | --- |
| ![Tickets](verification/android-navigation-tickets.png) | ![Account](verification/android-navigation-account.png) |

Transition frame comparisons and sampling limits are in
[PERFORMANCE.md](PERFORMANCE.md#navigation-continuity--15-september-2026).
The account card now relies on the global Tickets/Plans tabs to save space and
avoid duplicate navigation paths. The provisional map and Explore panels remain.

Type checking, lint and five frontend tests pass. New hook tests cover retained
content during refocus/reload, offline error feedback, revoked-access clearing,
account/date isolation and ignored late responses. Web and Android/iOS JavaScript
exports pass; the nested route groups produce 62 static entries including aliases
for the same 17 public routes (15 visitor routes plus sitemap/not-found).
The web main bundle remains 1.8 MB plus 45 KB additional JS and 44 KB CSS;
Android/iOS Hermes exports remain 3.7/3.4 MB. CI rechecks the final committed tree.
No release FPS, physical-device, iOS runtime or desktop interaction result is
inferred from these checks.

## Staff workspace and Android regression — 15 September 2026

The web-only `/operations` layout covers ten managed resources and read-only
visitor account lookup. It uses the shared gluestack cards, inputs, buttons,
checkboxes, selectors and modal API. Browser date/time/file controls and semantic
table elements are intentional web primitives. The visitor app's native routes,
five bottom tabs, Explore panels, provisional map and next-plan banner remain.

Safari walkthrough, using only the synthetic demo staff account:

- Staff sign-in and restored browser session; sidebar, overview and ride table
  rendered with the shared colors and spacing.
- Empty park submission showed server validation at the form and field.
- A draft survived Cancel → Keep editing. Saving added the record, updated the
  table/count and closed the dialog. The two synthetic parks were then removed
  through the staff API after checking that neither had related records.
- The long ride form scrolled within its dialog while keeping actions visible.
  The ride-type selector exposed the model choices. Nested park/area search used
  the staff session; an area result displayed **Technology Land**, not its parent
  park's name.

These checks found and fixed three integration defects: the desktop Box inherited
a column layout, Reanimated exit views left a completed dialog on screen, and
the overlay host sat outside the auth provider. The web modal now closes without
an exiting animated view, and auth wraps the gluestack overlay host.

![Operations overview](verification/web-operations-overview.png)
![Ride management](verification/web-operations-rides.png)
![Authenticated area picker](verification/web-operations-picker.png)

The Pixel 10 / Expo Go regression restored the existing native session and
rendered Explore with its bottom controls. The 16 September ticket deep link
showed the holder and two guest passes; Tickets → Map → Tickets retained the date
and group. Lost ADB reverse mappings initially prevented Expo from reaching
Metro; restoring ports 8000 and 8081 resolved that environment issue.

![Phone regression](verification/android-operations-regression.png)

Validation: 54 backend tests using disposable file-backed SQLite, six frontend
tests, type checking, lint, Expo alignment and the high-severity audit gate pass.
The audit still reports three moderate frontend findings. Web and Android/iOS
JavaScript exports pass; CI repeats the checks on the committed branch.

This is a staff preview checkpoint, not complete browser or accessibility
coverage. The computer-use bridge exposed table rows as cells and returned
`noWindowsAvailable` for coordinate actions, so row-edit/delete/admission
interaction checks remain pending; their API rules are covered by regression
tests. Full image-upload forms, narrower browser layouts and all role-specific
screens also need a browser pass. No physical device, native release binary,
iOS runtime, production deployment or release performance result is inferred.

## Native layout checkpoint — 15 September 2026

Pixel 10 / Expo Go: native headers and back controls replace the branded web
header. Explore shows all three demo rides without scrolling; the bottom banner
and five tabs remain. Compact card spacing keeps the ride booking action above
the navigation bar. Tickets use full-row touch targets.

![Native Explore](verification/android-native-explore.png)
![Native ride details](verification/android-native-ride.png)
![Native tickets](verification/android-native-tickets.png)

Tickets for **16 September (a future visit)** retained the holder and two guest
passes through Map → Tickets. A separate native check selected map pin 2,
opened Java Jamboree, opened its booking form, then used Android Back twice:
it returned to the map with pin 2 still selected. The booking form correctly
defaulted to 15 September and showed no tickets for that day; no booking was
submitted during this navigation check.

![Retained map selection](verification/android-native-map-return.png)

Type checking, six frontend tests, lint, web export and Android/iOS JavaScript
exports pass locally. New routes reuse the existing ride and reservation
components. This does not establish release FPS, cold-start time, iOS runtime,
large-font coverage or complete native design parity. Pull-to-refresh is
implemented; its gesture and error-state walkthrough remains open.

## Native map checkpoint — 15 September 2026

Pixel 10 / Expo Go verification covered the expanded map, compact ride panel,
next-pass banner and five tabs. Map pin 2 → Java Jamboree → Android Back retained
the selected pin. All rides → search “Java” → ride details → Back retained the
query; clearing the search and selecting Maintenance showed only Looping Logic.
Returning to the map retained pin 2.

![Native map](verification/android-map-full-screen.png)

The emulator was temporarily set to 840 × 1470 px at density 420
(320 × 560 dp), first at font scale 1.3 and then 1.6. The initial check exposed
colliding map labels and broken tab text. After the correction, tabs fit on one
line and scrolling exposed the selected ride, maintenance status and All rides
action. The original 1080 × 2424 px, density 420 and font scale 1.0 were restored.
The floating Tools control in screenshots belongs to Expo Go.

![Map with larger text](verification/android-map-large-text.png)
![Reachable actions with larger text](verification/android-map-large-text-actions.png)

Safari rendered the shared schematic and retained Java Jamboree after
Map → ride details → Back to map. This check also found native-only text
properties being forwarded to web spans; those props are now native-only and
the web warning is gone after reload.

Type checking, lint, six frontend tests and combined web/Android/iOS JavaScript
exports passed. No dependencies were added. This does not establish native
binary compatibility, release FPS, iOS runtime, a full six-pin visual check,
long ride lists or a full accessibility audit.

## Checks still required

Reset confirmation needs migration and runtime checks. Staff CRUD is implemented
with the remaining browser coverage listed above. Existing Django booking/authentication pages still need their shared
visual treatment. Visitor forms need a desktop web walkthrough. Additional
large-font and smaller-phone coverage beyond the map, screen-reader and
long-history checks remain.
Avatar selection is intentionally consolidated into initials until usable assets
exist, as recorded in the migration plan. No physical device, iOS simulator,
native release binary or app-store installation has been verified.
