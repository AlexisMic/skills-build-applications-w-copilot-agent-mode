# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each capability page focused on rendering and user interaction. Use `src/api/client.ts` for relative `/api` requests, and give every page accessible loading, empty, success, and error states. Do not duplicate business rules in the UI.
- Logic tier decision: Keep HTTP parsing and response shaping in the `/api` routes, and put validation and business behavior in explicit service functions. Return deliberate 4xx responses for malformed input, invalid IDs, missing referenced records, and unknown users; do not let Mongoose cast errors become 500 responses.
- Data tier decision: Keep persistence rules in Mongoose schemas, including required fields, references, and a default empty team-members array. Keep demo fixtures idempotent through upserts and preserve unrelated records when seeding.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate both IDs and confirm the user and team exist before writing. Store the corresponding references, compute points as one point per minute (consistent with the seeded examples), and assign `occurredAt` on the server.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and default members to an empty array. When member IDs are supplied, validate their format and existence before storing them.
- Leaderboard approach: Sum activity points by team, return each team's name and total with a 1-based rank, order highest totals first, and use team name as a deterministic tie-breaker.
- Workout suggestions approach: Find the user by email or return 404. Prefer workouts matching the user's fitness goal, then use their most recent activity as a fallback; include a short reason tying the suggestion to the goal or activity.

## Test plan

Record the commands you run and what each failure means.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks required schema fields, defaults, and safe/idempotent seeding. A failure indicates a persistence contract or fixture-management regression. Baseline: 4 failed, 1 passed; the four model validation checks fail and the seed test passes.
- API logic: `npm run test:api --prefix octofit-tracker/backend` checks activity/team creation and validation, leaderboard aggregation/ranking, and personalized workout suggestions. A failure indicates an API contract, service behavior, or response-status regression. Baseline: 4 failed; invalid writes return 501 instead of 400, the leaderboard is empty, and suggestions do not match user patterns.
- Presentation: `npm test --prefix octofit-tracker/frontend` checks API-driven content plus accessible loading, empty, and error states on each page. A failure indicates a UI/API integration or state-handling regression. Baseline: 15 failed.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript types and backend compilation; any failure indicates a type or compile error. Not run in the current baseline.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks TypeScript types and the Vite production bundle; any failure indicates a type or build error. Not run in the current baseline.
