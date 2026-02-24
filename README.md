# Friendly

A neighborhood-based social app that helps people build real-world connections through shared activities, local circles, and community events.

## Overview

Friendly makes it easy to meet people in your neighborhood by matching you with nearby residents who share your interests. Join circles, attend local events, earn badges, and grow your community — all within walking distance.

## Project Structure

```
friendly/
├── friendly-prototype.html     # Interactive HTML prototype
├── asset-test.html             # Design asset gallery
├── ios/                        # SwiftUI iOS app
│   ├── FriendlyApp.swift
│   ├── Models/                 # Data models
│   ├── ViewModels/             # View models
│   ├── Views/                  # SwiftUI views
│   ├── Services/               # Backend services
│   ├── Extensions/             # Swift extensions
│   └── Friendly.xcodeproj/
├── assets/                     # Recraft design assets
│   ├── activities/
│   ├── avatars/
│   ├── badges/
│   ├── icons/
│   ├── medals/
│   ├── onboarding/
│   ├── season/
│   └── ASSET_MANIFEST.md
├── scripts/
│   └── place-assets.sh
└── tasks/
    └── todo.md
```

## Features

- **Neighborhood Discovery** — Find and connect with people nearby
- **Circles** — Join interest-based groups in your area (book clubs, running groups, cooking circles)
- **Events** — Create and attend local meetups and activities
- **Smart Matching** — Get matched with neighbors based on shared interests and availability
- **Badges & Gamification** — Earn rewards for being an active community member
- **Seasonal Activities** — Discover season-specific events and activities

## Tech Stack

- **iOS**: SwiftUI, Combine
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Location**: CoreLocation, MapKit
- **Design**: Recraft AI-generated assets

## Getting Started

1. Open `ios/Friendly.xcodeproj` in Xcode
2. Add your `GoogleService-Info.plist` for Firebase
3. Build and run on simulator or device (iOS 17+)

## Prototype

Open `friendly-prototype.html` in a browser to explore the interactive prototype without building the iOS app.

## License

Private — All rights reserved.
