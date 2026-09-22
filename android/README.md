# Mom's Dragonfly — Android app (Trusted Web Activity)

The Android package is a **Trusted Web Activity (TWA)** that opens
<https://mom-s-dragonfly.vercel.app> in a fullscreen Chrome-backed shell.

- **Package ID:** `app.vercel.mom_s_dragonfly.twa`
- **Target SDK: 36 (current)** — this is what keeps Google Play Protect happy.
  Browser-minted WebAPKs (Samsung Internet / several OEM browsers) ship stale
  target SDKs and get blocked with *"built for an older version of Android"*.
  Never distribute one of those — build from here instead.
- **Signing key:** `android.keystore` (alias `android`) — **not in git**.
  Passwords live in `keystore-passwords.txt` — **not in git**.
  Backup copy: `~/Android/keystores/momsdragonfly/` on the build machine.

> ⚠️ **Keep the keystore safe.** Losing it means the app can never be updated
> in place (users must uninstall/reinstall) and the Play Store identity is tied
> to it. Back it up somewhere durable.

## Rebuild

Prereqs (already set up on this machine): JDK 17 at `~/Android/jdk-17`,
Android SDK at `~/Android/Sdk` (platform 36 + build-tools 36.1.0), bubblewrap
CLI (`npm i -g @bubblewrap/cli`, config at `~/.bubblewrap/config.json`).

```bash
cd android
export BUBBLEWRAP_KEYSTORE_PASSWORD=$(grep '^keystorePassword=' keystore-passwords.txt | cut -d= -f2)
export BUBBLEWRAP_KEY_PASSWORD=$(grep '^keyPassword=' keystore-passwords.txt | cut -d= -f2)
bubblewrap update --skipVersionUpgrade   # regenerate project from twa-manifest.json
bubblewrap build                          # outputs below
```

Outputs:

- `app/build/outputs/apk/release/app-release-signed.apk` — sideload / share directly
- `app/build/outputs/bundle/release/app-release-bundle.aab` — Play Store upload (if ever needed)

Bump `appVersionCode` (integer, always increasing) and `appVersion` in
`twa-manifest.json` for each release.

## Digital Asset Links

`public/.well-known/assetlinks.json` (in the web repo) lists the signing key's
SHA-256 fingerprint. Without a matching entry the app shows a URL bar; with it,
the app runs fullscreen with no browser UI.

```bash
~/Android/jdk-17/bin/keytool -list -v -keystore android.keystore -alias android -storepass "$(grep '^keystorePassword=' keystore-passwords.txt | cut -d= -f2)" | grep SHA256
```

If the signing key ever changes, update the fingerprint in that file and deploy
the web app.
