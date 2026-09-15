# Phone-first design notes

Direction confirmed by the user: preserve tidy panels, a persistent bottom
navigation/banner and the Explore panel; make content dynamic; add a provisional
map; prioritize usable phone space. Review actual Pixel 10 screenshots and touch
flows before desktop adaptation. The staff portal has its own web layout.

## Comparable products reviewed — 14 September 2026

The following observations come from the developers' current App Store screenshots
and descriptions, not from installing their apps or testing their Android builds.
The promotional screenshots are references only and are not copied into VirtualQ.

| Product | Observed structure | Application to VirtualQ |
| --- | --- | --- |
| My Disney Experience 8.24.1 | Compact attraction rows; date chips and chronological cards in My Plans; plans and map access beside each other | Dense ride summaries, date-scoped plans and visible reservation times |
| Universal Orlando Resort 2026.8.1 | Persistent bottom tabs; shortcut panel; category/filter controls over a map; a selected ride card at the bottom | Keep bottom navigation, compact Explore controls and a tappable map with a details panel |
| Wanderlog 2.220 | Map paired with itinerary/list; Overview/Itinerary/Explore separation; collapsible trip information | Separate browsing from a visitor's committed plans; summarize group/ticket information in small panels |

Primary sources:

- Disney: https://apps.apple.com/gb/app/my-disney-experience/id547436543
- Universal: https://apps.apple.com/gb/app/universal-orlando-resort/id878217080
- Wanderlog: https://apps.apple.com/gb/app/wanderlog-travel-planner/id1476732439
- Developer descriptions and screenshots were retrieved using Apple's public
  lookup endpoint for the above IDs and the `gb` storefront.

## Space and interaction budget

- Aim for a 56–64 dp header and a 56–64 dp bottom bar, plus actual system insets.
- Use 16–20 dp outer padding and 8–16 dp spacing inside panels.
- Primary page titles should usually be 24–30 dp. Avoid marketing headings that
  displace search, tickets or the next reservation.
- Use a compact park/visit summary banner and short ride rows on phones.
- Keep search and useful filters close to the list; show a result count and clear
  filter reset. Filter labels and status chips must wrap without horizontal overflow.
- Keep touch controls at least 44 dp tall; primary form actions 48 dp.
- Respect font scaling. Content scrolls; the bottom bar remains reachable and
  never covers the final action. Hide/adjust navigation when the keyboard needs
  that space, and keep focused fields/submission reachable.
- The eventual bottom destinations are Explore, Map, Plans, Tickets and You.
  Add destinations as their workflows become functional; never ship dead buttons.
- Plan panels show real dates, party sizes, booking times and server status.
  Ride duration must not be represented as live wait time.

## Map boundary

The initial map is a **schematic**, using real ride names/status with illustrative
pin positions. A visible label explains that it is provisional and not to scale.
Pins open a compact detail panel; an accessible ride list provides the same
destinations. No fake GPS dot, travel times or walking directions.
React Native SVG is a justified native graphics exception to gluestack controls.

## Native issues found during foundation verification

Pixel 10 is 1080 × 2424 px at density 420, approximately 411 × 923 dp.
Actual screenshots exposed tablet-style columns and a search field extending
outside the phone. The UniWind 1.12 / Tailwind 4.3.3 compiler resets media-query
context between grouped responsive rules. Pinning the preceding compatible
UniWind 1.11.0 / Tailwind 4.3.2 combination fixed that layout in native captures;
do not treat a browser build as proof of native responsive behavior.

The first native sign-in screen also wasted vertical space. Its title, header
and panel padding were reduced. Keyboard-open submission, successful sign-in,
secure session restoration and sign-out now pass on Pixel 10. See
[verification](VERIFICATION.md) for evidence and outstanding checks.
