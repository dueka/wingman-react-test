# WingMan AdsPower Test App

React test application for AdsPower browser automation with WingMan backend integration.

## Prerequisites

1. **AdsPower** installed and running on `localhost:50325`
2. **Node.js** v18+ installed
3. **WingMan backend** running (locally or on Digital Ocean)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/dueka/wingman-react-test.git
cd wingman-react-test
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the app

Edit `src/AdsPowerTest.tsx` and update these constants:

```typescript
const ADSPOWER_API_URL = 'http://localhost:50325'; // AdsPower API (local)
const BACKEND_API_URL = 'http://localhost:3000/api/v1'; // Change to your backend URL
const AUTH_TOKEN = '4c17d070-cae7-4fe7-abee-1429e1fa6d44'; // Your auth token
const MODEL_ID = '4b1178e1-1749-4ebf-ba28-a989d6308753'; // Emma Wilson
```

**For production backend:**
- Change `BACKEND_API_URL` to `http://157.245.43.188:3100/api/v1`
- Update `AUTH_TOKEN` with your production token

### 4. Start the dev server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## How It Works

This app demonstrates **client-side AdsPower automation**:

1. **Frontend calls AdsPower API directly** (localhost:50325)
2. **Backend only provides model data** (credentials, settings)
3. **AdsPower browser runs on user's machine** (where the React app runs)

### Architecture

```
React App (localhost:5173)
  ↓
  ├── Fetch model data → Backend API (localhost:3000 or DO)
  └── Control browser → AdsPower API (localhost:50325)
```

This solves the Digital Ocean deployment issue where the backend can't reach AdsPower on localhost.

## Usage

1. **Page loads** → Automatically fetches Emma Wilson's data
2. **Credentials displayed** → Snapchat username/password shown in yellow box
3. **Click "Create Profile"** → Creates AdsPower profile (or reuses existing)
4. **Click "Start Browser"** → Opens AdsPower browser window
5. **Manual login** → Navigate to https://web.snapchat.com and log in with displayed credentials
6. **AdsPower saves session** → Future logins automatic
7. **Click "Stop Browser"** → Closes browser when done

## Files

- **`src/AdsPowerTest.tsx`** - Main React component
- **`test-adspower-automation.js`** - Node.js test script (replicates backend behavior)

## Testing the Node.js Script

The `test-adspower-automation.js` file shows exactly what the backend does:

```bash
node test-adspower-automation.js
```

This script:
1. Fetches model data from backend
2. Extracts Snapchat credentials
3. Creates/reuses AdsPower profile
4. Starts browser via AdsPower API
5. Connects Puppeteer and navigates to Snapchat
6. Displays credentials for manual login

## Troubleshooting

### AdsPower not responding

```bash
# Check if AdsPower is running
curl "http://localhost:50325/api/v1/status"
```

Should return:
```json
{"code":0,"msg":"success","data":{...}}
```

### CORS errors

Make sure your backend has `http://localhost:5173` in allowed origins.

### Extension not loading (Windows vs Mac issue)

The extension should auto-load when using the backend's Puppeteer integration. If testing shows Mac vs Windows differences:

1. Manually install extension in AdsPower UI
2. Check AdsPower extension settings for the profile
3. Verify extension path is correct for your OS

## Backend Integration (For Reference)

The backend automation service (`/api/v1/automation/start`) won't work on Digital Ocean because:
- Backend is on DO server
- AdsPower runs on user's local machine (localhost:50325)
- Backend can't reach user's localhost

**Solution:** This React app calls AdsPower directly from the client.

## Model Data Format

```typescript
{
  id: "4b1178e1-1749-4ebf-ba28-a989d6308753",
  name: "Emma Wilson",
  snapchat_username: "winning2much",
  snapchat_password: "dymjiw-kiwja2-cugsEh",
  ads_power_profile_id: "k18b62yu", // Created on first run
  // ... other fields
}
```

## License

Private - WingMan Project
