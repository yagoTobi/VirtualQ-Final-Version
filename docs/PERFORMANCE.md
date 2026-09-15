# Native performance review

Apply the installed `react-native-best-practices` skill alongside gluestack v5
and ponytail. Measure the actual interaction before changing rendering/state
patterns; repeat the same measurement after a targeted change. A component count
is context, not a performance result. Do not add memoization or another state/list
library solely because it appears in a checklist.

## Development baseline — 15 September 2026

Code: `2bac075`. Pixel 10 emulator, Android 17, Expo Go 57.0.9,
React Native 0.86.3 / React 19.2.3, three seeded rides, local Django API.
Tool: Callstack `agent-device` 0.21.3, fetched from its verified npm repository
metadata and run outside the application's dependency tree.

The React DevTools helper runs on port 8097; Android reverse forwarding and an
Expo reload connected the app. `status` and `wait --connected` confirmed attachment
before recording. The actual flow was Explore → bottom Map tab → pin 2 →
Java Jamboree details. Native accessibility diffs confirmed each outcome.

| Observation | First pass | Repeat, unchanged code |
| --- | --- | --- |
| React commits | 12 | 14 |
| Reported maximum inclusive duration | 858.023 ms | 858.023 ms (twice) |
| Sum of exclusive work in the first maximum commit | 34.041 ms | 39.082 ms |
| Largest exclusive component in that commit | Pressable, 3.296 ms | View, 0.975 ms |
| Highest reported render count | Button, 6 | navigation providers, 5 |

The exact repeated inclusive maximum and much smaller exclusive totals need
further interpretation with native frame/CPU evidence. They do **not** establish
an 858 ms visible frame stall or identify VStack as the root cause. The exports
contain component names, timing and commit data; no speculative memoization or
state-library change was applied.

Raw local exports (ignored by Git):
`.local/verification/profiles/map-detail-first.json` and
`.local/verification/profiles/map-detail-repeat.json`.
Recording windows include operator pauses; their elapsed duration is not TTI.
These development/Expo Go traces are not release FPS or physical-device evidence.

The CLI is run with `npm exec --yes --package=agent-device@0.21.3 -- agent-device`.
The following commands assume that pinned CLI is on PATH. Reproduce with the app
open and connected:

```sh
agent-device react-devtools status
agent-device react-devtools wait --connected
agent-device react-devtools profile start
# Perform the same map/pin/detail interaction using current native element refs.
agent-device react-devtools profile stop
agent-device react-devtools profile slow --limit 5
agent-device react-devtools profile rerenders --limit 5
agent-device react-devtools profile timeline --limit 20
agent-device react-devtools profile export profile.json
```

## Remaining measurements

- Frame/CPU evidence for route transitions; repeat after the visitor navigation
  and forms migration using the same build type and dataset.
- Larger ride/ticket lists: measure eager mounting/scrolling before choosing
  FlatList or another virtualized list. Never nest a virtualized list in the page's
  vertical ScrollView. Preserve dynamic row height for font scaling.
- Text input and date/group selection: record the input interaction itself.
- Cold-start TTI, memory and native binary size on a development/release build;
  Expo Go's host application cannot prove VirtualQ release startup/size.
- Bundle attribution with Expo Atlas/source maps. Current export baselines are
  1.7 MB web JS + 42 KB CSS, 3.6 MB Android Hermes, 3.3 MB iOS Hermes. These sizes
  alone do not identify the heaviest modules.
- Android 16 KB binary alignment and a physical-device/iOS runtime pass when
  producing native release builds.
