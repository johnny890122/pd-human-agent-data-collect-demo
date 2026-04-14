<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Mo0KYmUbtggjpVpGE1zTpydOnf_qtTQP

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set credentials:
   - `GEMINI_API_KEY`
   - `MONGODB_URI`
   - `ADMIN_PASSWORD`
   - `VITE_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
3. Start backend (GraphQL + Express):
   `npm run dev:server`
4. Start frontend (Vite):
   `npm run dev`

Local development automatically uses Cloudflare Turnstile testing keys on `localhost`, so you do not need to add `localhost` to the production widget hostname allowlist.

## GraphQL Endpoint

- Local endpoint: `http://localhost:3001/graphql`
- Vite proxies `/graphql` to backend during frontend development.
## Model Collection Spec

### SessionSetup
Stores the core configuration for each experiment run.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | UUID | Primary Key |
| `activeEdgeIds` | `[String]` | IDs of edges active in this experiment |
| `scenarios` | `[Object]` | List of scenarios for the experiment |
| `focalNode` | String | ID of the focal node |
| `opponentNode` | String | ID of the opponent node |
| `sampleSize` | Number | Target number of participants (default: 20) |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

### Submission
Stores individual participant responses and progress.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | UUID | Primary Key |
| `sessionId` | String | References `SessionSetup._id` |
| `edgeId` | String | ID of the specific edge |
| `results` | `[Object]` | List of `{ scenarioId, cooperationProbability }` |
| `demographics` | Object | Optional `{ age, gender, education }` |
| `isCompleted` | Boolean | Completion status (default: false) |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |

### SessionReplay
Stores RRWeb event chunks for session playback and analysis.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | UUID | Primary Key |
| `sessionId` | String | References `SessionSetup._id` |
| `chunkIndex` | Number | Index of the RRWeb event chunk |
| `eventCount` | Number | Count of events in this chunk |
| `events` | `[Mixed]` | Array of RRWeb events |
| `createdAt` | Date | Mongoose timestamp |
| `updatedAt` | Date | Mongoose timestamp |
