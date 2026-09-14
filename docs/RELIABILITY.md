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

## Still open

- Reservation capacity, overlap, opening hours and edit validation need a common
  transactional path. SQLite is configured to begin atomic writes with IMMEDIATE
  locking; concurrent reservation tests are still required.
- Guest reassignment, ticket creation/reduction and staff admission workflows need
  additional validation and tests.
- Tokens are long-lived and logout revokes all sessions sharing that user's token.
  Native secure persistence and browser session handling are being implemented.
- Configure HTTPS, production hosts, secret key, email delivery and deployment
  request limits before public deployment. No production deployment is performed.
- Previously committed credentials/data remain in Git history. Local historical
  files are preserved and ignored. Credential rotation/history decisions belong
  to the repository owner; this branch does not rewrite shared history.

## Pending review tracks

Dependency advisories, native build compatibility, accessibility (including
keyboard/focus and contrast), performance and visual review are pending the new
frontend foundation. Report findings and verified exceptions here as they are
resolved; do not label the whole application audited from the first pass.
