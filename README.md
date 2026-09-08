# GeoAlarm 🚂📍

GeoAlarm is a mobile-first, offline-first "GPS Alarm" application designed for train travelers. When taking long train journeys, users can set a wake-up location (such as the railway station prior to their destination) and a trigger radius (e.g. 1–2 km). When their phone enters the target geographic area in the background, GeoAlarm triggers a loud local wake-up notification and audio alarm.

---

## Key Features

- **Mobile-Native Architecture**: Built with Next.js App Router and packaged as a native Android & iOS app using Capacitor 8.
- **Offline & Local Execution**: Journey tracking and detection happen entirely on-device. No backend server, continuous internet, or webhook required.
- **Background Location Tracking**: Operates reliably while the phone screen is locked or in a pocket using native background geolocation services.
- **Haversine Distance & Noise Filtering**: High-precision geographic distance calculation with protection against inaccurate GPS spikes.
- **Synthesizer Alarm & Haptics**: Plays a loud dual-pitch alarm chime via Web Audio API and triggers native device notifications and vibration patterns.
- **Developer Simulation Mode**: Built-in interactive GPS coordinate simulator for testing arrival triggers without taking a train.
- **Unit Tested**: Automated test suite powered by Vitest for Haversine calculations, geofence radius detection, and journey state persistence.

---

## How Does the App Know Where the User Is?

> **Architecture Flow Summary**
>
> Phone GPS
> → Native Background Location / Geofence
> → Current Coordinates
> → Target Coordinates
> → Haversine Distance & Geofence Check
> → Local Loud Alarm & Notification
>
> The core detection process is entirely local to the user's phone. At no point are GPS coordinates sent to a remote server, cron job, or external webhook.

1. **User Selection**: The user searches for or taps a target location (e.g., KSR Bengaluru City Station) and configures a trigger radius (e.g. 1 km).
2. **Local Persistence**: Target coordinates (`targetLatitude`, `targetLongitude`, `radiusMeters`) and journey status are saved locally in `@capacitor/preferences` / `localStorage`.
3. **Background Location Listener**: When the user taps "Start Wake-Up Alarm", the app initializes `@capacitor-community/background-geolocation` (native Android/iOS background watcher) or `navigator.geolocation` (web mode).
4. **Distance Calculation**: Upon receiving GPS updates, the app calculates the distance in meters between the phone's current coordinates and target coordinates using the **Haversine formula**.
5. **GPS Noise Protection**: Single erratic GPS readings (with high accuracy uncertainty) are filtered out. The app confirms arrival using a consecutive fix verifier before triggering.
6. **Local Alarm Trigger**: When distance falls below `radiusMeters`, the app immediately triggers:
   - A local notification with sound & vibration via `@capacitor/local-notifications`.
   - Continuous dual-frequency alert tone generated locally via Web Audio API.
   - Haptic vibration via `@capacitor/haptics`.
   - Full-screen high-priority wake-up UI modal with dismiss button.

---

## Setup & Running Guide

### 1. Prerequisites
- Node.js 18+ and `npm`
- Android Studio (for Android build)
- Xcode & CocoaPods (for iOS build on macOS)

### 2. Installation
```bash
git clone <repository-url>
cd geoalarm
npm install
```

### 3. Running Next.js Web Version
Run the local web development server with hot reloading:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Unit Tests
Execute the automated Vitest test suite:
```bash
npm test
```

### 5. Building & Syncing for Capacitor
Build the static web bundle and sync native Capacitor dependencies:
```bash
# Build Next.js static export & sync to native projects
npm run cap:sync
```

### 6. Running on Android
To open the project in Android Studio:
```bash
npm run cap:android
```
Or sync specifically for Android:
```bash
npx cap sync android
```

### 7. Running on iOS
To open the project in Xcode:
```bash
npm run cap:ios
```

---

## Native Permissions Setup

### Android (`AndroidManifest.xml`)
The following permissions are configured in `android/app/src/main/AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: High precision location access.
- `ACCESS_BACKGROUND_LOCATION`: Required for background tracking when phone is locked.
- `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_LOCATION`: Android persistent monitoring service.
- `POST_NOTIFICATIONS`: Android 13+ local notification alert permission.
- `VIBRATE` & `WAKE_LOCK`: Alarm vibration and screen wake.

### iOS (`Info.plist`)
The following keys are configured in `ios/App/App/Info.plist`:
- `NSLocationWhenInUseUsageDescription`: Explains foreground location requirement.
- `NSLocationAlwaysAndWhenInUseUsageDescription`: Explains background wake-up alarm location requirement.
- `UIBackgroundModes`: Configured with `location`, `remote-notification`, and `fetch`.

---

## Testing Without Traveling (Developer Test Mode)

You do not need to physically take a train journey to test GeoAlarm:

1. **Test Alarm Sound & Vibration**: Tap the **"Test Alarm Sound & Vibration"** button on the main screen to test the siren sound, vibration, and local notification for 4 seconds.
2. **Developer GPS Simulator**:
   - Start a journey to any location (e.g. Bengaluru City Station).
   - In the active journey screen, expand the **"Developer GPS Simulator"** panel.
   - Click **"Simulate Arrival inside Radius"** to immediately inject the target's exact coordinates.
   - Observe the distance drop to `0 m`, the local notification firing, the synthesizer sound playing, and the full-screen wake-up modal appearing.
3. **Vitest Unit Tests**: Run `npm test` to verify Haversine math, radius detection, and journey state persistence.

---

## Browser vs Native Platform Differences

| Capability | Native Mobile (Android/iOS) | Web Browser Fallback |
| :--- | :--- | :--- |
| **Background Execution** | ✅ Full OS background service & location watcher | ⚠️ Browser tabs may pause location when locked |
| **Locked Screen Alarm** | ✅ Triggers native sound, vibration & local notification | ⚠️ Audio requires active browser session |
| **Local Storage** | ✅ Native Capacitor Preferences | ✅ HTML5 `localStorage` |
| **GPS Precision** | ✅ Hardware GPS chip with high accuracy | ✅ Browser Geolocation API |

---

## Project Structure

```
geoalarm/
├── android/                   # Capacitor Android Native Project & Manifest
├── ios/                       # Capacitor iOS Native Project & Info.plist
├── app/
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main mobile-first application screen
│   └── globals.css            # Styling & dark theme setup
├── components/
│   ├── Header.tsx             # Mobile app header bar
│   ├── LocationPicker.tsx     # Leaflet map & Nominatim station search
│   ├── RadiusSelector.tsx     # Trigger radius selector (500m - 5km)
│   ├── JourneyCard.tsx        # Active journey card & distance meter
│   ├── PermissionGuide.tsx    # Permission request explanation modal
│   ├── AlarmTestButton.tsx    # Dedicated alarm sound check button
│   ├── DevTestPanel.tsx       # Developer GPS simulation panel
│   └── TriggeredAlarmModal.tsx # Full-screen wake-up alert modal
├── lib/
│   ├── location/
│   │   ├── types.ts           # Location & permission types
│   │   ├── distance.ts        # Haversine formula & GPS noise filter
│   │   ├── geocoding.ts       # Nominatim place search service
│   │   └── location-service.ts# Capacitor background location watcher
│   ├── journey/
│   │   ├── types.ts           # Journey state model
│   │   └── journey-store.ts   # Local offline persistence store
│   └── notifications/
│       └── alarm-service.ts   # Synthesizer audio chime & notifications
├── tests/
│   ├── distance.test.ts       # Haversine & radius unit tests
│   └── journey-store.test.ts  # State persistence unit tests
├── capacitor.config.json      # Capacitor configuration file
├── next.config.ts             # Next.js static export config
└── package.json               # NPM scripts & dependencies
```
