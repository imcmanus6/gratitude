# Android TWA release guide

The Android app is a Trusted Web Activity for
`https://gratitude.iskind.net/`, packaged as `net.iskind.gratitude`. It opens
the live PWA full-screen in Chrome, so the existing service worker and Web
Push implementation remain the notification channel.

## Prerequisites

Install Android Studio, or the Android SDK command-line tools, and JDK 17.
The project uses compile/target SDK 34 and Gradle 8.7. If using command-line
tools, install the required SDK packages:

```sh
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

From this directory, build a test APK with:

```sh
cd android
./gradlew assembleDebug
```

The APK is `app/build/outputs/apk/debug/app-debug.apk`.

## Signing and Play upload

Create an upload keystore once (keep it outside version control):

```sh
keytool -genkeypair -v -keystore gratitude-upload.jks -alias gratitude-upload -keyalg RSA -keysize 2048 -validity 10000
```

Set these environment variables for a signed release build:

```sh
export GRATITUDE_ANDROID_KEYSTORE="$PWD/gratitude-upload.jks"
export GRATITUDE_ANDROID_KEYSTORE_PASSWORD="..."
export GRATITUDE_ANDROID_KEY_ALIAS="gratitude-upload"
export GRATITUDE_ANDROID_KEY_PASSWORD="..."
./gradlew bundleRelease
```

The bundle is `app/build/outputs/bundle/release/app-release.aab`. Debug
builds do not require signing variables.

In Play Console:

1. Create the app and upload the AAB to internal testing.
2. Enable Play App Signing when prompted.
3. Open **Setup → App integrity** and copy the **App signing key
   certificate SHA-256** fingerprint. Include it and the upload key
   fingerprint, comma-separated, in `ANDROID_ASSETLINKS_SHA256` on Railway.
4. Verify the published response at
   `https://gratitude.iskind.net/.well-known/assetlinks.json`, then check
   verified links on a connected device:

   ```sh
   adb shell pm get-app-links net.iskind.gratitude
   ```

The Play listing needs a privacy policy URL, Data safety form, content rating,
phone screenshots at 1080x1920, a 1024x500 feature graphic, and a 512px app
icon. Notifications inside the TWA are the existing Web Push notifications;
users enable them from Settings in the app.
