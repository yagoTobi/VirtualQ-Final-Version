# Park relationships

The catalog is a hierarchy with required foreign keys:

```text
Park
└── Areas
    ├── Rides
    ├── Restaurants
    ├── Stores
    │   └── Products
    └── Employee records
```

A park can have many areas, rides, restaurants, stores and employees. Each of
those records has one park. Every ride, restaurant, store and employee also has
one area, which must belong to that same park. A product has one store and
inherits its location through the store; it has no separate park or area field.
Employee workplace type is a category, not a link to a particular ride or venue.

The existing park fields are retained for compatibility with historical data and
APIs. Model validation checks them against the area's park. The staff form clears
the selected area when the park changes and scopes area lookup to that park.

Move a ride, restaurant, store or employee by changing its park and area together.
An occupied area cannot be reassigned to a different park: move its contents into
a suitable destination area first. Moving an empty area is allowed. The API
reloads the current record and area and repeats validation inside the write
transaction, including after a form was initially validated.

Park/area/store deletion uses Django's cascade relationships. Staff API previews
show affected model counts, require permissions for every affected model, and
require confirmation for a cascade. Admitted or completed reservations block
API deletion. Restricted Django admin remains a fallback; its full deletion and
role walkthrough is still an open verification item.

## Check a restored or imported database

```sh
.venv/bin/python manage.py audit_park_hierarchy
```

The command checks foreign keys and park/area mismatches, changes no records, and
exits unsuccessfully if it finds a problem. Run it after migrations, restoring a
backup or importing catalog data. Direct SQL and Django bulk updates bypass
model/form validation; an import must validate records and run this check.

On 15 September 2026 both `db.local.sqlite3` and the historical `db.sqlite3`
passed using read-only connections. No data repair or schema change was needed.
Regression tests reproduce stale area moves and newly added children between
validation and save, and confirm that the audit detects an invalid bulk update
without silently repairing it. Transaction behavior is tested on file-backed
SQLite with `IMMEDIATE` transactions; PostgreSQL concurrency remains unverified.
