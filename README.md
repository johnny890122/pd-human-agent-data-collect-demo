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
3. Start backend (GraphQL + Express):
   `npm run dev:server`
4. Start frontend (Vite):
   `npm run dev`

## GraphQL Endpoint

- Local endpoint: `http://localhost:3001/graphql`
- Vite proxies `/graphql` to backend during frontend development.
