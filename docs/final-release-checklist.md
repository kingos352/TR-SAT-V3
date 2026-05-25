# Final Release Checklist (Phase 22)

Before tagging and releasing TR-SAT Mission Control V3, the following Quality Assurance (QA), Security, and Build checks must be verified.

## 1. Build & Test Verification
- [x] **Backend Tests:** Run `pytest tests -v` in `/backend`. All tests (SGP4, Conjunction, API, Astrodynamics) must pass.
- [x] **Frontend Build:** Run `npm run build` in `/frontend`. Must build with zero TypeScript or Vite errors.
- [x] **One-Click Launcher:** Test `TR-SAT-Build.bat` and `TR-SAT-Start.bat`. Must automatically boot without crashing.

## 2. Browser Runtime & UI QA
- [x] No black screen upon application launch.
- [x] No fatal console errors (F12 Developer Tools).
- [x] CesiumJS rendering works offline (if base layers cached).
- [x] All 10 demo workflow steps succeed manually:
  1. API ONLINE
  2. Sync `stations` catalog
  3. Search `ISS`
  4. Set as active target
  5. Update state/orbit
  6. Live Tracking initializes and streams
  7. Mission Replay scrubs timeline smoothly
  8. Visibility Scan returns targets above horizon
  9. Conjunction Screening returns miss distances
  10. Catalog Layer renders without crashing

## 3. Security Audit
- [x] `.env` is fully ignored by Git.
- [x] `.env.example` contains only placeholders (no real Space-Track, Cesium, or AI provider keys).
- [x] No SQLite database (`catalog.db`) committed unless intentional and scrubbed of private data.

## 4. Scientific Terminology & Guardrails
- [x] Confirm no claims of "direct telemetry" (uses "TLE/GP-based SGP4 propagation").
- [x] Confirm no claims of "collision probability" or "Pc" (uses "geometric miss-distance screening").
- [x] Confirm no claims of "certified operational ephemeris".
- [x] Mission Knowledge Assistant correctly refuses operational commands and adheres to guardrails.
- [x] Analytics and Reliability indicators explicitly labeled as "situational-awareness aids, not certified operational SSA products."
