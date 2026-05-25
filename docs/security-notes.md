# Security Notes

As of Phase 13 (Release Candidate Hardening), a comprehensive security audit has been performed on the TR-SAT Mission Control V3 codebase.

## 1. Secrets Management
- The `.env` file is strictly ignored via `.gitignore` to prevent accidental commits of secrets.
- An `.env.example` file is provided as a template containing only empty placeholders for sensitive keys.
- **NEVER** commit your active `.env` file. Keep all credentials strictly local.

## 2. Space-Track Credentials
- The Space-Track API requires an authenticated username and password.
- These credentials (`SPACETRACK_USERNAME` and `SPACETRACK_PASSWORD`) are loaded securely on the FastAPI backend environment.
- The frontend **does not** have access to, nor does it expose or transmit, your Space-Track credentials. All authentication is proxied through the backend.

## 3. Cesium Ion Token
- The `CESIUM_ION_TOKEN` (used in backend for 3D tiles) and `VITE_CESIUM_ION_TOKEN` (used in frontend for CesiumJS initialization) are treated as sensitive.
- Like Space-Track credentials, these are entirely omitted from version control and must be provided locally in your `.env` file.

## 4. Codebase Audit Results
- Automated `grep` searches confirmed that no default passwords, hardcoded credentials, or leaked tokens exist in the source code or test files.
- Test suites mock credential availability without requiring or leaking real keys.

## 5. Mission Knowledge Assistant (AI)
- **Proxy Architecture**: The Gemini AI API key (`AI_PROVIDER_KEY`) is securely managed by the FastAPI backend. The frontend communicates with the AI strictly through backend proxy endpoints, ensuring that API keys are never exposed to the client.
- **Informational Only**: The assistant operates in a strict read-only, informational mode. It does not have access to operational commands, and it cannot control or modify the system state or satellite telemetry.
- **Scientific Wording Constraints**: The assistant is implemented with guardrails to refuse questions attempting to elicit direct telemetry outputs (e.g. raw sensor data streams) or operational collision probabilities, ensuring answers remain strictly within scientific and educational boundaries.
