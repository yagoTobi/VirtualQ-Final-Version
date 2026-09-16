# Browser verification — 16 September 2026

This walkthrough uses Safari through the computer-control tool. It is in
progress; the table below distinguishes completed checks from outstanding work.
The main local database and historical database are not test fixtures.

## Isolated preview

The QA backend runs at `http://127.0.0.1:8002`, with a newly migrated and seeded
database and separate media directory under the ignored
`.local/verification/browser-qa-20260916/` directory. The web preview runs at
`http://127.0.0.1:8082`, with `EXPO_PUBLIC_API_URL` pointing to that backend.
CORS and the backend's visitor-origin setting explicitly name the QA origin.
The ordinary services on ports 8000/8081 remain separate.

The demo accounts come from `seed_demo`. An additional synthetic
`qa-ride-reader` account has only the ride-view permission. No real account
passwords or permissions were changed. This is a development-browser check,
not verification of a deployed production web server.

## Completed checks

- Staff sign-in reached the operations dashboard. Safari password saving was
  declined. Resource counts and backend requests confirmed the isolated data
  source.
- An empty park form reported required-field feedback. Creating and reopening
  `QA Riverside Park` worked; editing its name saved and returned to the list.
- Keyboard navigation reached search, refresh and row actions. Opening a row
  editor with Return and returning focus after save were exercised. This is
  partial keyboard evidence, not a screen-reader conformance claim.
- `QA Gardens` was created under `QA Riverside Park`.
- The ride form disabled Area until Park was selected. Each area picker showed
  only the selected park's area. Changing Park cleared the prior Area.
- `QA Garden Ride` was created with an uploaded image, description, height,
  capacity, duration, opening hours, type, age category and wheelchair flag.
  Reopening the form retained these values. The stored hours were 09:00–20:00;
  the uploaded image bytes matched the selected file.
- Searching for `QA Garden` returned that ride alone.
- Moving the ride to another park without an area produced an error; a database
  read confirmed the original location remained intact. Selecting the matching
  area then saved the move and a maintenance change. Capacity, duration and
  image were retained.
- Moving the now-occupied area to another park was rejected with instructions
  to move its children first. Cancel and the unsaved-change confirmation
  discarded that attempted edit.
- The isolated database's hierarchy audit reported zero mismatches after the
  valid ride move.
- The ride-only staff account saw only Rides navigation and View row actions.
  Add, Edit and Delete controls were absent. Its read-only details had a Close
  action and no editable fields. Parent-detail lookups returned 403; the UI
  displayed unavailable-record labels. Direct navigation to
  `/operations/parks` displayed “Workspace unavailable.”
- Read-only values now display Yes/No and choice labels (“Slow Rides,”
  “Adults”); image fields expose a “View image” link. The dialog retained
  keyboard focus and Page Down scrolled its content while Close stayed visible.
- `QA Garden Cafe` was created in Park 2 / Area 2 with an image and 09:00–20:00
  hours. Its area picker contained only `QA Gardens`. Reopening retained the
  relationship names, description and image; editing the short description
  saved successfully.
- `QA Garden Gifts` was created in the same park and area with an image and
  09:00–20:00 hours. The store's area picker was likewise park-scoped.
- `QA Garden Mug` was created under that store with an image and a decimal
  price. Reopening retained the store label and `12.50` price. A negative price
  was rejected with field feedback; a corrected `14.75` saved and appeared in
  the list.
- The store deletion preview reported exactly one product and one store.
  The final destructive action is awaiting confirmation; this is preview
  evidence only.
- A database read confirmed the restaurant edit, matching park/area IDs,
  opening hours and product price. A fresh hierarchy audit reported zero
  mismatches across rides, restaurants, stores and employees.
- `QA Gardener` was created under Park 2 / Area 2 with birth and joining dates,
  a 09:00–17:00 shift and Ride workplace. Reopening retained those values, and
  editing the job title saved. Optional email and phone fields stored `NULL`.
- A ticket for `demo-admin` was created for 18 September, found by username,
  then moved to 16 September before reservations existed. Owner and party
  position were displayed as immutable values.
- A second ticket at party position 1 created its linked guest automatically.
  The submitted visit date and the guest's date both stored 16 September.
  Editing the guest's name, age and height saved and appeared in the list.
  Its ticket is now read-only in the editor, matching the existing backend
  rule against guest reassignment; another height edit still saved.
- A Python Plunge reservation for that guest stored 16 September,
  15:00–15:05. Attempting admission before the booked time was rejected with
  explicit time-window feedback and left the reservation unadmitted.

## Typed dates and immutable guest tickets

Typing `1` then `8` into an existing ticket's day segment produced `8` with
the controlled date input. Replacing `value` with `defaultValue` on the browser
date/time fields allows the browser to retain partially typed segments while
`onChange` still updates the submitted form values. Repeating the same sequence
produced `18`; full year entry, a newly typed guest-ticket date, and a reservation
time also saved correctly. No browser clock or system date was changed.

The guest editor previously offered a ticket picker despite the API rejecting
guest reassignment. The schema now marks that relationship immutable after
creation, so the shared form displays its name and omits it from edit payloads.
The API's validation and permissions remain in force.

## Relationship labels

Reopening an existing record initially displayed only “Selected record #1” for
Park and Area. The shared picker now resolves the stored selection through the
existing authenticated resource-detail endpoint and uses the shared record-name
formatter. Names appeared correctly when reopening the QA ride in Safari.
New selections retain their immediate labels; changing the parent still clears
the area. The same resolver is used for immutable/read-only relationships; the
restricted-role checks above confirmed its permission-denied fallback.

The existing resource hook cancels stale requests and separates results by path
and account. Failed lookups retain an explicit unavailable-record label rather
than inventing a name. No endpoint permissions were expanded.

## Remaining browser matrix

| Workflow | Status |
| --- | --- |
| Parks, areas, rides | Create/edit and hierarchy checks above; deletion pending |
| Maintenance | Change saved; filter and visitor presentation pending |
| Restaurants | Create, reopen and edit passed; deletion pending |
| Stores and products | Create, product edit/validation and cascade preview passed; deletion pending |
| Employees | Create, reopen and edit passed; deletion pending |
| Tickets and guests | Create/edit and immutable ownership passed; reservation-related date guard and deletion pending |
| Reservations and admission | Create and early-admission rejection passed; edit, conflict, successful admission and deletion pending |
| Restricted staff and visitor permissions | Ride-only staff and direct-route denial passed; visitor denial pending |
| Visitor authentication, profile, booking, passes and cancellation | Pending in browser |
| Recovery submission | Requires user handoff for entering a changed credential |
| Django admin fallback | Pending |
| Narrow layout, zoom, focus and screen-reader review | Partial keyboard checks only |
| Legacy route parity and removal | Pending; legacy client/pages retained |

Type checking, linting, all nine frontend tests and the web export passed after
the label and read-only presentation changes. The export is build evidence;
the walkthrough used the development preview.

After the date-input and guest-metadata fixes, type checking, linting, the web
export and nine frontend tests passed again. The local backend suite ran 67 tests successfully
with four database-specific checks skipped on SQLite; PostgreSQL checks remain
part of CI.

## Screenshots

- [Saved relationship names](verification/web-ride-editor-labels.png)
- [Occupied-area move rejected](verification/web-occupied-area-rejected.png)
- [Restricted resource route](verification/web-restricted-route.png)
- [Readable view-only values](verification/web-read-only-labels.png)
- [Store and product deletion preview](verification/web-store-cascade-preview.png)
- [Guest ticket locked during edits](verification/web-guest-ticket-locked.png)
- [Admission outside the booked window rejected](verification/web-early-admission-rejected.png)

Backend logs and additional screenshots are retained with the isolated fixture
while the walkthrough continues. No destructive UI deletion has been performed.
