# Accessibility review

## Scope — 16 September 2026

This checkpoint reviews shared form colors and compact Android layouts. It is
not a WCAG conformance statement. Runtime evidence uses the installed VirtualQ
debug app on the Pixel 10 emulator; web and iOS runtime coverage remains open.

## Form contrast

The shared Input and Select trigger used the decorative `border` token. Its
contrast against a card was only 1.40:1 in light mode and 2.01:1 in dark mode,
making empty fields difficult to identify. They now use the dedicated `input`
token. Invalid Input outlines use the full destructive color, and Select
placeholder text uses `muted-foreground` instead of half-opacity foreground.
Decorative card borders retain their existing appearance.

Ratios below use the declared sRGB colors in `frontend/global.css`, the WCAG
relative-luminance formula and alpha compositing where applicable. Thresholds
are checked before rounding. Normal text needs 4.5:1; a boundary needed to
identify a control needs 3:1.

| Pair | Light | Dark |
| --- | ---: | ---: |
| Input boundary / card | 3.71 | 5.42 |
| Input boundary / page | 3.47 | 6.28 |
| Input boundary / input fill | 3.71 | 3.21 |
| Input placeholder / input fill | 6.11 | 4.60 |
| Invalid boundary / input fill | 6.64 | 4.60 |
| Focus boundary / input fill | 7.36 | 5.85 |
| Select placeholder / card | 6.11 | 7.78 |
| Select icon / card | 3.01 | 4.39 |
| Select focus boundary / card | 4.57 | 6.89 |

The dark input fill is the existing 30% input color over card. The app currently
selects light mode explicitly; dark values were calculated, not visually
verified. These pairs do not establish contrast for every possible override,
background, disabled state or overlay.

The Profile screen was inspected before and after restarting Metro and the
installed Android app. Empty and populated outlines are visible without changing
the form layout. No profile values were saved.

![Profile input outlines before and after](verification/android-input-contrast.png)

References:

- [WCAG 2.2 contrast for text](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2 non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

## Phone layout and motion

At 320 × 560 dp and font scale 1.6, Profile and visit-booking actions were
reachable by scrolling. Built-in native text fitting now prevents the fixed-width
tab labels from truncating; content text retains system scaling. Full accessible
tab names, selected state and touch targets remain in place.
Screenshots, restored device settings and the floating-keyboard limitation are
recorded in [verification](VERIFICATION.md#compact-phone-and-large-text-checks--16-september-2026).

The prior navigation check verified Android reduced-motion changes while the app
was mounted. See [performance evidence](PERFORMANCE.md#navigation-continuity--15-september-2026).
This does not establish screen-reader reading order or announcements.

## Remaining checks

- TalkBack and VoiceOver: reading order, field/error associations, live feedback,
  route changes, dialog focus and selection announcements.
- Browser keyboard navigation, visible focus, zoom/reflow and staff tables/forms.
- Complete large-text coverage, including long translated names and histories.
- Docked keyboard at compact phone dimensions and iOS keyboard/safe-area behavior.
- Runtime contrast for every state, including selection sheets and custom
  background overrides. Dark-mode runtime verification before exposing a theme
  preference.
