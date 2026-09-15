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

## Checks still required

Reset confirmation and staff CRUD need migration and runtime
checks. Existing Django booking/authentication pages still need their shared
visual treatment. Visitor forms need a desktop web walkthrough. Additional
large-font, screen-reader, smaller-phone and long-history checks remain.
Avatar selection is intentionally consolidated into initials until usable assets
exist, as recorded in the migration plan. No physical device, iOS simulator,
native release binary or app-store installation has been verified.
