# Native builds

The native project is generated from `frontend/app.json` and the pinned npm
lockfile. `frontend/android/` and `frontend/ios/` are ignored build output.
Keep native configuration in Expo config/plugins, not manual generated edits.

## Toolchain

- Node 22 and the packages installed by `npm ci`.
- JDK 17. The local check uses Temurin **17.0.20.1+1**.
- Android SDK, platform-tools, Build Tools 36.0.0, Platform 36,
  NDK 27.1.12297006 and CMake 3.22.1. Gradle can install missing SDK packages
  when the SDK licenses are already accepted.
- Gradle 9.3.1 comes from the pinned Expo 57 template.

The first local build with Android Studio's bundled JBR 25.0.3 failed in
`react-native-worklets` and `react-native-screens` CMake configuration with a
restricted `java.lang.System` warning. Use JDK 17 for this project.
The project-local JDK archive was downloaded from Adoptium's official release
and checked against its published SHA-256:

```text
OpenJDK17U-jdk_aarch64_mac_hotspot_17.0.20.1_1.tar.gz
196d13ba5f10414bef7f6a05a9b3f00edacb18ebacef2b99485db9e2ee18f0e8
```

## Build and install on the Pixel 10

Start the Django backend using the README instructions. Select Node 22 and set
`JAVA_HOME` to your JDK 17 installation. For this checkout on macOS:

```sh
export JAVA_HOME="$PWD/.local/java/jdk-17.0.20.1+1/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PWD/.local/node/node_modules/.bin:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

cd frontend
npm ci
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
```

In a separate terminal, run `make preview` from the repository root, then launch
the installed app:

```sh
adb shell am start -n com.virtualq.app/.MainActivity
```

`npm run android` is Expo's standard build/install command and can start Metro
itself. `npm run android:go` and `make preview-android` retain the Expo Go path.
`npm run ios` is the corresponding native iOS command. CI now verifies iOS
startup and catalog connectivity; broader iOS workflows remain outstanding.

The arm64 debug APK is a development app, needs Metro, and uses the generated
debug signing key. It is separate from Expo Go and has its own stored session.
It is not an app-store release or an offline standalone build. Release signing,
an HTTPS API environment, other Android ABIs and physical iPhone builds need separate
verification.

## CI artifact

The `android` job in `.github/workflows/checks.yml` repeats prebuild and builds
arm64 Debug and Release QA APKs on Linux with JDK 17. It runs on pull requests,
main-branch pushes and manual dispatches; feature pushes do not duplicate the
native builds. Artifacts are retained for seven days. For the development app:

```sh
gh run download RUN_ID --name virtualq-android-arm64-debug --dir .local/android-artifact
```

The installed CI debug artifact also passed an ELF-level check of all 25 arm64
native libraries: every LOAD segment has 16 KB alignment. Its hash was matched
against the installed APK. See [the binary audit](PERFORMANCE.md#installed-android-elf-alignment--16-september-2026).
Repeat ELF and zip checks on release artifacts; the debug result is not a
release certification.

### Separate Android Release QA app

The Release matrix entry changes the generated app's name to **VirtualQ Release
QA**, package to `com.virtualq.app.releaseqa` and URL scheme to
`virtualq-releaseqa`. Only the CI checkout's Expo configuration is changed.
It installs alongside the development app with separate storage and cannot
replace that app's session. The normal source configuration remains unchanged.

The artifact contains production-mode bundled JavaScript and does not need
Metro. CI checks for a nonempty `assets/index.android.bundle`, the QA package
identifier, a non-debuggable manifest and 16 KB zip alignment. Expo's generated
test signing key is retained: this is a local QA build, not store signing.

```sh
gh run download RUN_ID --name virtualq-android-arm64-release-qa --dir .local/android-release-qa
adb install -r .local/android-release-qa/app-release.apk
adb reverse tcp:8000 tcp:8000
adb shell am start -n com.virtualq.app.releaseqa/.MainActivity
```

The bundle targets `http://127.0.0.1:8000`; start the local demo backend first.
This configuration is intended for the available Android 17 / API 37 Pixel
emulator, where Android permits localhost cleartext by default. No general
cleartext exception is added. Older Android versions and physical devices need
a separately verified HTTPS API configuration. Check the app's catalog and
screens after installation; a successful build alone is not runtime evidence.

## iOS simulator build

The `ios` CI job uses the arm64 `macos-26` runner, Xcode 26.4.1, Node 22 and
CocoaPods 1.17.0. It generates the `VirtualQ` workspace and scheme from the same
Expo configuration and lockfile, installs pods, and builds Release for the iOS
simulator with code signing disabled. The artifact must contain the arm64
executable and bundled `main.jsbundle`. This is a simulator build, not an iPhone
distribution archive or App Store release.

The job runs for pull requests, main-branch pushes and manual workflow dispatches;
feature-branch pushes do not duplicate the macOS job. On a successful run:

```sh
gh run download RUN_ID --name virtualq-ios-arm64-simulator-release --dir .local/ios-artifact
tar -xzf .local/ios-artifact/build/VirtualQ.app.tar.gz -C .local/ios-artifact
```

The archive preserves the app's executable permissions. The artifact also
includes the generated `ios/Podfile.lock` for the pod versions used in that run.
The committed `frontend/Podfile.lock` comes from the first successful native
build. CI copies it into the generated project and uses `pod install --deployment`
so dependency or Podfile drift fails instead of silently changing the lock.

For a local build, install CocoaPods 1.17.0 with
`gem install cocoapods --version 1.17.0 --no-document`. Generate the project and
restore the lock before installing pods (run from `frontend/` with Xcode selected):

```sh
npm ci
npx expo prebuild --platform ios --no-install
cp Podfile.lock ios/Podfile.lock
cd ios
pod _1.17.0_ install --deployment
```

Keep the committed lock outside the generated `ios/` directory so a clean
prebuild does not remove it. When intentionally upgrading npm/native packages
or changing the generated Podfile, run `pod _1.17.0_ install` without deployment
mode, review its changes and copy `ios/Podfile.lock` back to `frontend/Podfile.lock`.
Commit it with the package/configuration change and verify the native CI build.
Do not update pods independently of the pinned Expo/React Native dependency set.

From the repository root, on a Mac with Xcode and a booted arm64 simulator:

```sh
xcrun simctl install booted .local/ios-artifact/VirtualQ.app
xcrun simctl launch booted com.virtualq.app
```

The JavaScript bundle uses the app's configured API address. With the default
local address, run the Django backend on that Mac before using data-dependent
screens. The current development machine has command-line tools but no Xcode.
Local iOS project generation passes; the startup job below exercises the built
artifact on CI's simulator.

### CI startup check

After a successful iOS build, `ios-startup` downloads that run's artifact on a
separate macOS runner and boots the installed iPhone 17 / iOS 26.4 simulator.
The CI app bundle explicitly targets `http://127.0.0.1:8000`. Django runs there
with a newly migrated, seeded database under the runner's temporary directory.
No historical database or developer account is used.

The check installs and launches the Release app, waits for its successful ride
catalog request, and captures the first screen twice, eight seconds apart, so
transient simulator notifications can disappear. Its readiness probe requests
parks, so that probe cannot satisfy the app's ride-request assertion. The backend
and simulator stop afterward. The `virtualq-ios-startup-evidence` artifact
contains both screenshots, simulator inventory, launch result and backend request
log; inspect the screenshot before claiming the layout was verified.

The automated assertion covers startup and public catalog connectivity, not iOS
authentication, booking, camera, accessibility, release FPS or physical-device
behavior. A passing job still requires visual inspection of its screenshot.

The first runtime check passed in PR #23 commit `a451c90`, Actions run
`35057206466`. The app fetched all three seeded rides successfully. Visual
inspection showed the native list and five bottom tabs, but an iOS welcome
notification obscured the header. It also exposed a low-contrast placeholder;
the shared primitive fix and Android regression evidence are recorded in the
[accessibility review](ACCESSIBILITY.md#native-placeholder-color--16-september-2026).

### First verified artifact — 16 September 2026

PR #18 commit `f7fda6b`, Actions run `35049875243`, passed all checks. Native
compilation, architecture verification and artifact upload succeeded. The app
was downloaded and inspected locally:

- Tarball: 12,273,502 bytes; SHA-256
  `ff35b57360fa81eabaab84449b727c359b36c281959c18f96618576ad76f36f8`.
- Executable: arm64, 18,005,080 bytes, executable permissions retained.
- Bundled JavaScript: 3,462,151 bytes.
- Bundle identifier `com.virtualq.app`, platform `iPhoneSimulator`, minimum iOS
  16.4, Xcode 26.4.1; light appearance and the `virtualq` URL scheme are present.

The generated Podfile checksum matches the local generated project. This first
artifact was built before deployment-mode lock enforcement was added. PR #20
commit `c8e1242`, Actions run `35051746423`, subsequently passed all checks,
including the native simulator build with `pod install --deployment`. Its
downloaded `ios/Podfile.lock` exactly matches the committed
`frontend/Podfile.lock`. No simulator launch, physical iPhone
installation, network behavior, signing/distribution or release performance was
verified by inspecting the archive.

## Appearance and permissions

`expo-system-ui` is pinned to the SDK 57-compatible version so Android's light
appearance is applied outside the React view tree as well. Launcher and themed
icons use the existing primary colors. Regenerate the committed images with:

```sh
.venv/bin/python frontend/scripts/generate_icons.py
```

The script uses the backend's pinned Pillow and needs no font download.
Unused template background/splash artwork is removed. The app blocks legacy
external-storage permissions; the camera permission remains for ticket scanning.
Secure Store's config plugin excludes its encrypted entries from Android backup.
Inspect the merged APK manifest when changing native dependencies.

## Open diagnostic

Expo Router 57.0.21 logged one development warning about a state update before
mounting after replacing the local app with the CI APK. The stack points to its
initial-link promise handler. A subsequent cold start did not repeat it and
navigation/session restoration worked. Recheck initial links and release
startup before shipping; do not hide the warning or assume it is resolved.
