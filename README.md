
```markdown
# 💰 Expense Manager

A cross-platform personal finance tracker built with React Native and Expo.
Track expenses, visualize spending with interactive charts, and keep your data
secure with dual-factor biometric + PIN authentication.
---

## ✨ Features

### Core
- 📊 **Dashboard** — real-time balance, income, and expense summary
- 💸 **Transactions** — add, edit, delete, and search across all entries
- 🏷️ **Custom categories** — add your own with icons and colors
- 📈 **Statistics** — interactive donut charts with Week / Month / Year ranges
- 🏦 **Wallet** — set an initial balance to get your true current total
- 🎯 **Monthly budget** — progress bar that turns red when over budget

### Security
- 🔐 **PIN lock** — 4–6 digit PIN stored in hardware-backed secure storage
- 👆 **Biometric unlock** — Fingerprint / Face ID integration
- 🛡️ **Auto-repair logic** — self-heals if the auth state ever becomes corrupted
- 🚫 **Full-screen lock** — app content never renders while locked

### Data
- 📁 **CSV backup** — export all transactions to a shareable CSV file
- 📥 **CSV restore** — import from a file with lossless round-trip (hidden timestamp column)
- 📤 **Share CSV** — quick export to send to spreadsheets or other users
- 💾 **SQLite persistence** — fast, indexed, structured storage

### Polish
- 🌓 **Dark mode** — automatic via system preference
- 🎨 **Design system** — centralized theme (colors, spacing, radius, shadows)
- ⚡ **Reanimated 3** — 60fps native-thread animations
- 📱 **Safe area aware** — handles notches, gestures, and keyboard properly

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81 |
| **Toolchain** | Expo SDK 57 |
| **Language** | TypeScript |
| **Navigation** | Expo Router v5 (file-based) |
| **State** | React Context + custom hooks |
| **Persistence** | SQLite (`expo-sqlite`) + AsyncStorage |
| **Secure storage** | Expo SecureStore (Keychain / Keystore) |
| **Auth** | `expo-local-authentication` |
| **File I/O** | `expo-file-system`, `expo-sharing`, `expo-document-picker` |
| **Charts** | `react-native-svg` (custom donut chart) |
| **Animation** | Reanimated 3 + Gesture Handler |
| **Build** | Gradle + JDK 17 |

---

## 🏗️ Architecture

The app follows a **4-layer architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────┐
│                   UI LAYER                      │
│   Screens (Expo Router) + Reusable Components   │
└─────────────────────┬───────────────────────────┘
                      │ hooks + context
┌─────────────────────▼───────────────────────────┐
│              STATE / CONTEXT LAYER              │
│   SettingsContext · CategoriesContext           │
│   TransactionModalContext                       │
└─────────────────────┬───────────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────────┐
│                 SERVICE LAYER                   │
│   transactionService · exportService            │
│   pinService · biometricService                 │
│   categoryService · walletService               │
└─────────────────────┬───────────────────────────┘
                      │ reads/writes
┌─────────────────────▼───────────────────────────┐
│               PERSISTENCE LAYER                 │
│   SQLite · AsyncStorage · SecureStore · FS      │
└─────────────────────────────────────────────────┘
```

### Key design decisions

- **Context over Redux** — Only 3 pieces of global state; Context + hooks is enough.
- **A `version` counter for reactivity** — Any write increments a counter, and every screen re-fetches on change. Simple pub/sub without a full state library.
- **Service layer over raw storage** — UI never touches SQLite directly. Swapping storage engines (e.g., to a backend API) would only require rewriting services.
- **Self-healing auth** — On boot, if `pinEnabled=true` but no PIN exists in SecureStore, the lock auto-disables to prevent permanent lockout.

---

## 📁 Project Structure

```
expense-tracker-app/
├── src/
│   ├── app/                       # Screens (file = route)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx        # Tab navigator
│   │   │   ├── index.tsx          # Home / Dashboard
│   │   │   ├── statistics.tsx     # Charts + analytics
│   │   │   ├── wallet.tsx         # Initial balance
│   │   │   └── profile.tsx        # Settings + security + data
│   │   └── _layout.tsx            # Root providers + PIN gate
│   │
│   ├── components/                # Reusable UI
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── TransactionModal.tsx
│   │   ├── BudgetEditModal.tsx
│   │   ├── CategoriesModal.tsx
│   │   ├── DonutChart.tsx
│   │   ├── EmptyState.tsx
│   │   ├── CustomTabBar.tsx
│   │   ├── PinPad.tsx
│   │   └── PinLockOverlay.tsx
│   │
│   ├── context/                   # Global state
│   │   ├── SettingsContext.tsx
│   │   ├── CategoriesContext.tsx
│   │   └── TransactionModalContext.tsx
│   │
│   ├── services/                  # Business logic + I/O
│   │   ├── transactionService.ts
│   │   ├── categoryService.ts
│   │   ├── walletService.ts
│   │   ├── settingsService.ts
│   │   ├── exportService.ts
│   │   ├── pinService.ts
│   │   ├── biometricService.ts
│   │   └── storage.ts
│   │
│   ├── constants/
│   │   ├── theme.ts               # Colors, spacing, radius, shadows
│   │   └── categories.ts
│   │
│   └── utils/
│       └── format.ts              # Date / currency formatters
│
├── assets/images/                 # Icon, splash, adaptive icons
├── app.json                       # Expo config
├── eas.json                       # EAS build profiles
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for quick testing) **or** Android Studio (for native builds)
- JDK 17 (for local release builds)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/expense-manager.git
cd expense-manager
npm install
```

### Run in development

```bash
# Start Metro bundler
npx expo start

# Or run directly on a connected Android device
npx expo run:android

# Or on iOS (macOS only)
npx expo run:ios
```

Press `a` in the Metro terminal to launch on a connected Android device.

---

## 📦 Building a Release APK

### 1. Generate a signing keystore (one-time)

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore expense-manager.keystore \
  -alias expense-manager \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Place the keystore

Copy `expense-manager.keystore` into `android/app/`.

### 3. Configure signing in `android/app/build.gradle`

```gradle
signingConfigs {
    release {
        storeFile file('expense-manager.keystore')
        storePassword 'YOUR_PASSWORD'
        keyAlias 'expense-manager'
        keyPassword 'YOUR_PASSWORD'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

### 4. Build

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### 5. Install on a connected device

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

Install steps:
1. Download the APK on your Android device
2. Enable "Install from unknown sources" for your browser/file manager
3. Tap the APK → Install
4. First launch will show a Play Protect warning → tap **Install anyway** (expected for self-signed apps)

**Minimum requirements:** Android 7.0 (API 24) — arm64 or armeabi-v7a.

---

## 🧪 Testing the App

Walk through these flows after install:

- [ ] Add a transaction → appears on Home
- [ ] Edit / delete via long-press
- [ ] Search by title, category, or amount
- [ ] Switch Statistics between Week / Month / Year
- [ ] Toggle Expense / Income chart
- [ ] Set monthly budget → bar turns red when exceeded
- [ ] Set Wallet initial balance → Current Balance updates
- [ ] Enable PIN lock → kill app → lock screen appears
- [ ] Enable biometric → use fingerprint to unlock
- [ ] Backup to CSV → file saved
- [ ] Restore from CSV → transactions reimported
- [ ] Kill app → reopen → data persists

---

## 🔐 Security Notes

- PINs are stored in **`expo-secure-store`**, which uses:
  - **iOS:** Keychain
  - **Android:** Keystore (hardware-backed when available)
- The PIN is **never** written to AsyncStorage or plaintext.
- Biometric prompts use `disableDeviceFallback: true`, so users can't bypass the app lock with their device passcode.
- CSV backups **do not** contain the PIN — only transaction data.

---

## 🗺️ Roadmap

- [ ] Cloud sync (Firebase / Supabase)
- [ ] Recurring transactions
- [ ] Multi-currency with live conversion
- [ ] Export to PDF reports
- [ ] Home screen widgets
- [ ] iOS release

---

## 🤝 Contributing

This is a personal project, but issues and PRs are welcome.

1. Fork it
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © [Bublai Sarkar](https://github.com/YOUR_USERNAME)

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev) for the managed workflow and EAS Build
- [React Native](https://reactnative.dev) for the framework
- [Ionicons](https://ionic.io/ionicons) for the icon set

---

<p align="center">Made with ❤️ using React Native + Expo</p>
```

---
