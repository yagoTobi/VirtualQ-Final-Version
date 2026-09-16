# Native Android builds

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
`npm run ios` is the corresponding native iOS command; iOS runtime verification
is still outstanding.

The arm64 debug APK is a development app, needs Metro, and uses the generated
debug signing key. It is separate from Expo Go and has its own stored session.
It is not an app-store release or an offline standalone build. Release signing,
an HTTPS API environment, other Android ABIs and iOS binaries need separate
verification.

## CI artifact

The `android` job in `.github/workflows/checks.yml` repeats prebuild and the
arm64 debug build on Linux with JDK 17. It uploads
`virtualq-android-arm64-debug` for seven days. After a successful run:

```sh
gh run download RUN_ID --name virtualq-android-arm64-debug --dir .local/android-artifact
```

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
