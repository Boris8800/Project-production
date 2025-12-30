<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11rKZP9e3lPQyIFR8HEEXpCXGhkSYh-9n

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` and set:
   - `VITE_GEMINI_API_KEY=...`
   - `VITE_GOOGLE_MAPS_API_KEY=...` (optional; used for embedded maps)
3. Run the app:
   `npm run dev`

## Production build

1. Build:
   `npm run build`
2. Preview locally:
   `npm run preview`

## Docker (recommended for production)

Build and run:

`docker build -t transfer-line-travel:latest .`

`docker run --rm -p 8080:80 transfer-line-travel:latest`

Open: http://localhost:8080

## Security note (Gemini API key)

This app currently calls Gemini from the browser, which means the API key is shipped to users.
For a real production deployment, proxy Gemini calls via a backend service to keep secrets server-side.
