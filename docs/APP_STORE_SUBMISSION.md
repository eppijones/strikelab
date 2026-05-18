# StrikeLab App Store Submission

## First Release Scope

Version 1.0 is a focused iPhone + Apple Watch caddie release:

- iPhone account login, profile, scorecard, rounds, range capture, export, legal, support, and account deletion.
- Apple Watch round/range companion, workout tracking, swing motion capture, optional microphone impact timing, haptics, and phone sync.
- Web sync through `https://strikelab.golf/api`.

Deferred from the mobile App Store review surface unless explicitly production-ready:

- Payment and booking checkout.
- Provider OAuth integrations.
- Broad social/beta experiments.
- Developer API URL and bearer-token entry.
- Demo reset controls.

## Required Pre-Archive Configuration

- Apple Developer account: `espen@strikelab.golf`.
- Membership is active. Use this Apple ID in Xcode and App Store Connect for archive upload, TestFlight, and App Review submission.
- Xcode currently uses automatic signing with Team ID `73D3GXKCHQ`. After the account is active, confirm that this Team ID belongs to the `espen@strikelab.golf` StrikeLab team. If it does not, update the signing team for both the iPhone and Watch targets before building for TestFlight.
- Set `CLERK_PUBLISHABLE_KEY` to the production `pk_live_...` value through uncommitted `apps/ios/Config/Local.xcconfig`, CI, or Xcode Cloud.
- Confirm Vercel production env has `DEBUG=false`, production Clerk issuer/JWKS/audience/secret, `DATABASE_URL`, `SECRET_KEY`, and media storage configured.
- Confirm App Store Connect bundle IDs:
  - iPhone: `com.strikelab.caddie.StrikeLabCaddie`
  - Watch: `com.strikelab.caddie.StrikeLabCaddie.watchkitapp`

## Build Button Readiness

Before pressing Build/Archive:

- `espen@strikelab.golf` is signed into Xcode and App Store Connect.
- Xcode is signed into `espen@strikelab.golf`.
- Both targets use the correct active StrikeLab signing team.
- The production Clerk publishable key is available to the Release build.
- `https://strikelab.golf/privacy`, `/terms`, `/support`, and `/api/health` are live.
- A production review account exists and can sign in from both iPhone and web:
  - Email: `demo@strikelab.golf`
  - Password: `demo123`
- App Store Connect app record exists for the bundle ID before uploading.

## Owner-Only TestFlight Smoke Test

Do not invite external testers for the first submission. Use internal TestFlight only for the owner account to prove Apple distribution, signing, embedded Watch install, and production login.

Run on a real iPhone with paired Apple Watch:

- Fresh install from TestFlight.
- Register/sign in through production Clerk.
- Confirm `/api/health` and authenticated sync work through `strikelab.golf`.
- Open Profile and verify Privacy, Terms, Support, Export, and Delete Account are visible.
- Start/end a round and confirm Watch state sync.
- Start/end a range session and confirm optional microphone capture remains off until enabled.
- Deny/allow Location, HealthKit, Motion, and Microphone permissions.
- Delete the test account and confirm sign-out.

## App Review Notes

Give Apple the following notes with the binary:

- Demo account: `demo@strikelab.golf` / `demo123`. Confirm this user exists in the production Clerk/API environment before submitting.
- Legal/support links work without login at `https://strikelab.golf/privacy`, `https://strikelab.golf/terms`, and `https://strikelab.golf/support`; the iPhone login screen also exposes these links.
- Account deletion path: iPhone app → Profile tab → Account → Delete account. Web path: Settings → Delete account.
- Location is requested when starting or resuming an active round. It is used for shot distances, course context, and Watch caddie sync.
- Apple Watch HealthKit, Motion, and Location prompts appear when starting a round or range session after an in-app explanation.
- Microphone capture is optional and off by default. The Watch asks for microphone permission only after the user enables Profile → Swing Capture → Mic-confirmed impact.
- First release hides mobile booking/payment checkout unless that surface is explicitly marked production-ready.

## App Store Connect Metadata Draft

- Name: StrikeLab Caddie
- Subtitle: Golf caddie and Watch swing tracker
- Category: Sports
- Support URL: `https://strikelab.golf/support`
- Marketing URL: `https://strikelab.golf/`
- Privacy URL: `https://strikelab.golf/privacy`
- Review notes: Use demo account `demo@strikelab.golf` / `demo123`. Apple Watch pairing is recommended to test swing, workout, and range features. Microphone impact capture is optional and off by default. HealthKit, motion, and location are requested only after starting a round or range flow with in-app explanation.

## Privacy Label Draft

Data linked to user:

- Contact info: email address.
- User content: golf rounds, scorecards, range sessions, notes, optional impact audio.
- Health and fitness: workouts, heart rate, HRV/resting-heart-rate context when enabled.
- Location: course/shot location during active rounds.
- Identifiers: account/user ID and auth identifiers.

Not used for tracking:

- No third-party advertising tracking.
- No sale of personal performance data.

Data processors:

- Clerk for authentication.
- Vercel for hosting/functions and optional Blob media.
- PostgreSQL database for app data.

## Release Acceptance

- Release build hides developer URL/token controls and demo reset.
- Release build hides or neutralizes mobile Tee booking/payment checkout until production-ready.
- Privacy manifests are present for iPhone and Watch targets.
- In-app account deletion works from iPhone and web Settings.
- Production Clerk and Vercel login/sync verified from TestFlight.
- App Store metadata, privacy label, legal pages, and binary behavior match.
