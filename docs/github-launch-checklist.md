# GitHub Launch Checklist

Before pushing this repository publicly and announcing the release, strictly follow this checklist to ensure security, quality, and professionalism.

## 1. Security & Secrets Verification
- [ ] Verify `.env` is NOT tracked by Git (`git check-ignore -v .env`).
- [ ] Verify `.env.example` contains NO real credentials.
- [ ] Verify `SPACETRACK_USERNAME` and `SPACETRACK_PASSWORD` are not hardcoded in backend services.
- [ ] Verify `CESIUM_ION_TOKEN` is not hardcoded in the frontend.

## 2. QA & Build Validation
- [ ] Run backend tests: `cd backend && py -m pytest -q` (All must pass).
- [ ] Run frontend build: `cd frontend && npm run build` (Must complete without errors).
- [ ] Open the app manually and verify the Demo Workflow can be completed start-to-finish.

## 3. Media & Presentation
- [ ] Capture the 5 required screenshots exactly as instructed in the README.
- [ ] Place the screenshots in the `docs/assets/screenshots/` directory.
- [ ] Review `README.md` to ensure the screenshot paths correctly display the images.
- [ ] Ensure no fake data or fake screenshots are present.
- [ ] Determine the appropriate Open Source License and update the `README.md` License section.

## 4. Scientific Terminology Check
- [ ] Ensure no claims of "collision probability", "direct telemetry", or "radar tracking" remain anywhere in the visible UI or documentation.

## 5. GitHub Repository Polish
- [ ] Commit all final Phase 14 documentation changes.
- [ ] Create an annotated Git tag for the release: `git tag -a v0.8.0 -m "Release Candidate v0.8.0"`
- [ ] Push code and tags to GitHub: `git push origin main --tags`
- [ ] Go to GitHub Releases and draft a new release for `v0.8.0`, copying the contents of `CHANGELOG.md`.
- [ ] Add relevant repository topics (e.g., `astrodynamics`, `sgp4`, `cesiumjs`, `fastapi`, `react`, `space-situational-awareness`).
- [ ] Pin the repository to your GitHub profile.
- [ ] (Optional) Upload the finalized Demo Video to YouTube/Vimeo and link it at the top of the README.
