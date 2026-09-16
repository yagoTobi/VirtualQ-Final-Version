# Ponytail audit

Original audit after the local-setup repair, with implementation updates below.
Line estimates include vendored text assets and logs, not just application code.
Correctness and security findings are recorded separately in
[docs/RELIABILITY.md](docs/RELIABILITY.md).

## Applied or revised — 16 September 2026

- native: Removed 165 checked-in Django/DRF vendor assets, deleting 35,985 text
  lines. All matched Django 4.1.9 and DRF 3.14.0 wheels; one license file differed
  only in line endings. They were overriding the pinned, installed packages.
  Static finders and `collectstatic` now supply the current framework assets.
  App-owned CSS and profile icons remain.
- delete: The historical Yarn error log is already untracked and ignored.
- native: The original broad `UserUpdateSerializer.update` and manual uniqueness
  validators were removed. **Keep the current selective-save override**: a
  reproduced profile/reset race requires writing only submitted profile fields.
  Removing it would allow an in-flight profile save to restore an old password.
- delete: The unused `ResetPasswordConfirm` and `CustomAuthToken` classes were
  removed. Active authentication paths have regression coverage.

Validation: `collectstatic` produced 164 files in a disposable directory;
framework and app-owned asset bytes matched their static-finder sources. The
live Django admin login loaded seven styles/scripts matching the installed
packages over HTTP. `manage.py check` passed. Desktop visual inspection remains
open while browser control is unavailable.

## Original remaining candidates

Recheck these against the route-parity gates before deleting the legacy client.

- delete: Cut four duplicate/test home banners and their inert login buttons (about 68 lines). Keep the first account banner and first queue explanation. [HomeScreen.js](userApp-React-Native/src/screens/HomeScreen.js).
- shrink: Cut repeated `getUserDetails` request bodies across the profile, guest, booking, and scanner screens. Use one small shared fetch function with caller-owned loading state; no API-client class. [UserInfoScreen.js](userApp-React-Native/src/screens/UserInfoScreen.js), [GuestInformationScreen.js](userApp-React-Native/src/screens/GuestInformationScreen.js), [RideReservationScreen.js](userApp-React-Native/src/screens/RideReservationScreen.js), [TicketScanScreen.js](userApp-React-Native/src/screens/TicketScanScreen.js).
- delete: Cut unreferenced `RestaurantType` model code (25 lines). `Restaurant.restaurant_types` is a plain string, with no relationship or admin/API consumer of the type table; remove the table only with a reviewed migration if historical rows need no preservation. [restaurantApp/models.py](restaurantApp/models.py).
- delete: Cut the disconnected visit state/handlers and unused clear-filter callback (about 25 lines). They are not passed into `RideBanner`, and `FilterPanel` implements its own clear action; keep the future itinerary feature in the backlog. [RidesListScreen.js](userApp-React-Native/src/screens/RidesListScreen.js).
- delete: Cut the empty, uninstalled `parkOperatorApp` scaffold (18 lines). Replacement: nothing. [parkOperatorApp](parkOperatorApp).
- shrink: Cut the second avatar-choice list. Iterate `Guest.PICTURE_CHOICES` in `AvatarURLsView`. [ticketApp/views.py](ticketApp/views.py), [ticketApp/models.py](ticketApp/models.py).
- native: Cut the custom comma-splitting filter. Use `filters.BaseInFilter(field_name=...)` for both fields; preserve the existing comma-separated query contract. [rideApp/views.py](rideApp/views.py).
- native: Cut three direct FontAwesome SVG dependencies plus the separate `react-native-vector-icons` dependency. Reuse the already installed `@expo/vector-icons` for the same icons, preserving accessibility indicators. [RideBanner.js](userApp-React-Native/src/components/RideBanner.js), [package.json](userApp-React-Native/package.json).
- stdlib: Cut NumPy from the standalone simulation. Replace scalar sampling with `random.expovariate(1 / 3)` and `random.uniform(2, 5)`; the distributions match, though seeded sequences differ. NumPy is not needed by the running app. [QueueingSim.py](QueueingSim.py).

The original estimate was approximately 43,000 removable text lines, mostly
vendor assets/logs. The vendor deletion above is measured; remaining line and
dependency savings need recounting after legacy-client parity is verified.
