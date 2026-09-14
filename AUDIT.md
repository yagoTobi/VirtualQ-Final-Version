# Ponytail audit

Audit of the remaining code after the authorized local-setup repair. Ranked by removable bulk; these suggestions have not been applied. Line estimates include vendored text assets and logs, not just application code. Runtime correctness, security, and performance need a separate review; known prototype gaps are recorded in the README.

- native: Cut checked-in Django/DRF static bundles (35,923 text lines, 165 files), after checking for intentional customizations. Use installed apps' static finders in development and `collectstatic` for deployment; preserve app-owned CSS. [static/admin](static/admin), [static/rest_framework](static/rest_framework).
- delete: Cut the 6,916-line historical Yarn error log. Replacement: nothing; ignore `yarn-error.log`. [userApp-React-Native/yarn-error.log](userApp-React-Native/yarn-error.log).
- delete: Cut four duplicate/test home banners and their inert login buttons (about 68 lines). Keep the first account banner and first queue explanation. [HomeScreen.js](userApp-React-Native/src/screens/HomeScreen.js).
- shrink: Cut repeated `getUserDetails` request bodies across the profile, guest, booking, and scanner screens. Use one small shared fetch function with caller-owned loading state; no API-client class. [UserInfoScreen.js](userApp-React-Native/src/screens/UserInfoScreen.js), [GuestInformationScreen.js](userApp-React-Native/src/screens/GuestInformationScreen.js), [RideReservationScreen.js](userApp-React-Native/src/screens/RideReservationScreen.js), [TicketScanScreen.js](userApp-React-Native/src/screens/TicketScanScreen.js).
- native: Cut `UserUpdateSerializer.update` and the two manual uniqueness validators (34 lines). `ModelSerializer` already assigns model fields and adds `UniqueValidator` for the model's unique username/email fields; retain the model constraints and verify partial updates. [clientApp/serializers.py](clientApp/serializers.py).
- delete: Cut unreferenced `RestaurantType` model code (25 lines). `Restaurant.restaurant_types` is a plain string, with no relationship or admin/API consumer of the type table; remove the table only with a reviewed migration if historical rows need no preservation. [restaurantApp/models.py](restaurantApp/models.py).
- delete: Cut unused `ResetPasswordConfirm` and `CustomAuthToken` classes and their now-unused imports. URL routes already use Django's password-reset view and the active `login` function. [clientApp/views.py](clientApp/views.py), [clientApp/urls.py](clientApp/urls.py).
- delete: Cut the disconnected visit state/handlers and unused clear-filter callback (about 25 lines). They are not passed into `RideBanner`, and `FilterPanel` implements its own clear action; keep the future itinerary feature in the backlog. [RidesListScreen.js](userApp-React-Native/src/screens/RidesListScreen.js).
- delete: Cut the empty, uninstalled `parkOperatorApp` scaffold (18 lines). Replacement: nothing. [parkOperatorApp](parkOperatorApp).
- shrink: Cut the second avatar-choice list. Iterate `Guest.PICTURE_CHOICES` in `AvatarURLsView`. [ticketApp/views.py](ticketApp/views.py), [ticketApp/models.py](ticketApp/models.py).
- native: Cut the custom comma-splitting filter. Use `filters.BaseInFilter(field_name=...)` for both fields; preserve the existing comma-separated query contract. [rideApp/views.py](rideApp/views.py).
- native: Cut three direct FontAwesome SVG dependencies plus the separate `react-native-vector-icons` dependency. Reuse the already installed `@expo/vector-icons` for the same icons, preserving accessibility indicators. [RideBanner.js](userApp-React-Native/src/components/RideBanner.js), [package.json](userApp-React-Native/package.json).
- stdlib: Cut NumPy from the standalone simulation. Replace scalar sampling with `random.expovariate(1 / 3)` and `random.uniform(2, 5)`; the distributions match, though seeded sequences differ. NumPy is not needed by the running app. [QueueingSim.py](QueueingSim.py).

Estimates: approximately 43,000 removable text lines, mostly vendor assets/logs; four direct mobile dependencies plus the optional simulation's NumPy dependency.

net: -43000 lines, -5 deps possible.
