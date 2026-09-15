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

## Checks still required

Reset confirmation, remaining guest/avatar flows, ride reservations, cancellation,
camera scanning and staff CRUD need migration and runtime checks. New visitor
forms also need their desktop web walkthrough. Additional large-font,
screen-reader, smaller-phone and desktop checks
remain. No physical device, iOS simulator, native release binary or app-store
installation has been verified.

## Reservation regression pass

All 22 backend tests pass with `DJANGO_TEST_DATABASE_PATH` set to a fresh temporary
SQLite file. Coverage now includes opening/closing boundaries, same-day past
times, absent height, cross-ride overlap, adjacent intervals, peak occupancy,
batch rollback, released capacity, rescheduling, admission fields, preserved
duration and malformed filters. Two concurrent connections competing for one seat
produce exactly one successful booking. This is API/database evidence; native
reservation forms still need migration and the subsequent walkthrough.
