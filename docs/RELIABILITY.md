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
  Native SecureStore persistence is verified on Pixel 10; the web uses tab-lifetime
  sessionStorage. These do not change the server token's lifetime.
- Configure HTTPS, production hosts, secret key, email delivery and deployment
  request limits before public deployment. No production deployment is performed.
- Previously committed credentials/data remain in Git history. Local historical
  files are preserved and ignored. Credential rotation/history decisions belong
  to the repository owner; this branch does not rewrite shared history.

## Pending review tracks

Accessibility (including screen-reader/focus and contrast), performance and the
complete visual review remain pending. Foundation native evidence is recorded in
[VERIFICATION.md](VERIFICATION.md); it is not a whole-product audit.

## Frontend dependency review — 15 September 2026

The lockfile pins Expo 57.0.22, React Native 0.86.3, gluestack core 5.0.15,
UniWind 1.11.0 and Tailwind 4.3.2. Expo's version-alignment check passes.
UniWind/Tailwind's subsequent combination applied desktop media rules on Android;
keep this pair until an upstream fix is tested on the emulator.

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
