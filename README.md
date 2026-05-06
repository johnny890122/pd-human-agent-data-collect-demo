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
## User Flow

1. **Experiment Configuration**: An admin logs into the Admin Console and configures a new experiment setup. This can be a single session or a batch of sessions (Session Group). They define the network topology (focal node, opponent node, active edges) and the target sample size.
2. **Link Distribution**: The admin generates a unique survey link and distributes it to participants.
3. **Survey Initialization**: A participant opens the link. The system creates a survey entry, initializes session tracking, and performs bot protection verification using Cloudflare Turnstile.
4. **Experiment Scenarios**: The participant navigates through the introduction and completes the required experimental scenarios (e.g., indicating cooperation probabilities in a Prisoner's Dilemma context).
5. **Demographics & Completion**: The participant fills out demographic information. Upon submission, the survey is marked as complete, and the participant is shown the outro screen. If the session is full (target sample size reached), new participants will see a "Session Full" message.
6. **Data Analysis**: The admin can view the results, track completion rates, and even watch replays of the participant's session in the Admin Console.

## Admin Functionality

The Admin Console (`/admin`) is a protected route that provides several key features for managing the experiment:

- **Setup Panel (`/admin/setup`)**: Configure new experimental sessions. Select the focal node, opponent node, active edges within the network graph, and set the target sample size.
- **Batch Mode / Groups (`/admin/view/batch`)**: Create and manage multiple sessions at once as a `SessionGroup`. Useful for running large-scale iterations of the experiment. The table view shows progress and completion percentages for each group.
- **Session History (`/admin/view/manual`)**: View past single-session setups, track their submission counts, and access their specific configurations.
- **Session Replay (`/admin/replay/:sessionId`)**: Watch a video-like playback of a participant's interaction with the survey, recorded using RRWeb.
- **Database Management**: In development mode, admins have the ability to clear the database for testing purposes.

## Survey View

The Survey View (`/survey`) is the participant-facing interface designed for optimal data collection:

- **Session Persistence**: Progress is tracked using `localStorage` and URL parameters. If a participant accidentally refreshes or leaves, their session is restored so they can continue from where they left off.
- **Anti-Bot Protection**: Integrates Cloudflare Turnstile to ensure high-quality, human responses.
- **Dynamic Routing**: Guides participants sequentially through `/survey/welcome`, `/survey/intro`, `/survey/scenarios`, and finally `/survey/outro`.
- **Session Recording**: Integrates a `SessionRecorder` (powered by RRWeb) to capture DOM changes and user interactions silently in the background for behavioral analysis.

## Model Collection Spec

### SessionGroup
Manages batch-created session groups.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | UUID | Primary Key |
| `name` | String | Group name |
| `description` | String | Optional description |
| `batchMode` | Boolean | Batch mode flag (default: true) |
| `edgeCount` | Number | Number of edges to sample (1-12) |
| `focalNode` | String | ID of the focal node |
| `opponentNode` | String | ID of the opponent node |
| `sampleSize` | Number | Target number of participants per session |
| `totalSessions` | Number | Total sessions in this group |
| `completedSessions` | Number | Number of completed sessions |
| `status` | String | `creating`, `active`, `completed`, `archived` |

### SessionSetup
Stores the core configuration for each experiment run.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | UUID | Primary Key |
| `groupId` | String | (Optional) References `SessionGroup._id` if part of a batch |
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
