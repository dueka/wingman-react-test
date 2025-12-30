# WingMan AdsPower Automation Manager

Production-ready React application for managing multi-model AdsPower browser automation with WingMan backend integration.

## Prerequisites

1. **AdsPower** installed and running on `localhost:50325`
2. **Node.js** v18+ installed
3. **WingMan backend** running (locally or on Digital Ocean)
4. **Valid agency subscription token** with models configured

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

### 3. Start the dev server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## How To Use

### 1. Configuration

When the app loads, you'll see the Configuration section:

- **Auth Token** (required): Your agency subscription token
- **Agency ID** (required): Your agency UUID
- **Backend URL**: WingMan backend API URL (defaults to production)
- **AdsPower URL**: Local AdsPower API URL (defaults to `localhost:50325`)

### 2. Fetch Models

1. Enter your **Auth Token** and **Agency ID**
2. Click **"Fetch Models"** button
3. The app will load all models belonging to your agency

### 3. Manage Models

Each model card shows:
- **Model Name** and ID
- **Snapchat Credentials** (if configured)
- **Profile Status**: AdsPower profile ID and browser status
- **Automation Status**: Whether automation is enabled

### 4. Start/Stop Automation

For each model, you can:
- **🚀 Start Automation**: Creates/reuses AdsPower profile, starts browser with extension, navigates to Snapchat
- **🛑 Stop Automation**: Stops the browser and disables automation
- **📊 Check Status**: Fetches current automation status from backend

## How It Works

### Architecture

```
React App (localhost:5173)
  ↓
  ├── Authenticate → Backend API (/api/v1/model/agency_get_models)
  ├── Fetch Models → Backend returns all agency models
  └── Control Automation → Backend API (/api/v1/automation/start|stop)
       ↓
       Backend → AdsPower API (localhost:50325) → Opens browser
       ↓
       Browser with Extension → Auto-login to Snapchat
```

### Backend Automation Flow

1. **Start Automation** calls `/api/v1/automation/start` with `model_id`
2. Backend fetches model's Snapchat credentials from database
3. Backend creates/reuses AdsPower profile for the model
4. Backend starts AdsPower browser with WingMan extension loaded
5. Extension auto-connects to backend via WebSocket
6. Extension auto-logins to Snapchat using model's credentials
7. Model's automation status updated in database

### Key Features

- **Multi-Model Support**: Manage multiple models from a single interface
- **Dynamic Configuration**: All credentials fetched from backend database
- **Real-Time Status**: Check automation status for each model
- **Production Ready**: No hardcoded values, token-based authentication
- **Centralized Logging**: Activity logs for all operations

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/model/agency_get_models/:agency_id` | GET | Fetch all models for agency |
| `/api/v1/automation/start` | POST | Start automation for a model |
| `/api/v1/automation/stop` | POST | Stop automation for a model |
| `/api/v1/automation/status/:model_id` | GET | Get automation status |

## Getting Your Credentials

### Auth Token

Your agency subscription token can be found in the WingMan dashboard or database:

```sql
SELECT token, agency_id FROM subscriptions WHERE status = 'active';
```

### Agency ID

Your agency UUID can be found in the WingMan dashboard or database:

```sql
SELECT id, name FROM agencies;
```

## Troubleshooting

### Models not loading

```bash
# Check if backend is running
curl "http://157.245.43.188:3100/api/v1/model/agency_get_models/YOUR_AGENCY_ID?page=1&size=10" \
  -H "Authorization: YOUR_TOKEN"
```

Should return:
```json
{
  "data": [...models...],
  "meta": {"page": 1, "size": 10, ...}
}
```

### AdsPower not responding

```bash
# Check if AdsPower is running
curl "http://localhost:50325/api/v1/status"
```

Should return:
```json
{"code":0,"msg":"success","data":{...}}
```

### Automation not starting

1. Check activity logs in the app for error messages
2. Verify model has Snapchat credentials configured
3. Ensure AdsPower is running
4. Check backend logs for automation service errors

### Extension not loading

The extension is automatically loaded by the backend when starting automation. If it's not working:

1. Verify extension is built and available on the backend server
2. Check backend automation service configuration
3. Ensure extension has correct model ID configured

## Development vs Production

### Development (Local Backend)

```typescript
Backend URL: http://localhost:3000/api/v1
```

### Production (Digital Ocean)

```typescript
Backend URL: http://157.245.43.188:3100/api/v1
```

The app defaults to production. Change the Backend URL in configuration section if testing locally.

## Security Notes

⚠️ **Important**:
- Never commit auth tokens to version control
- Keep subscription tokens secure
- Use HTTPS in production environments
- Rotate tokens regularly

## Example Usage

1. **Agency Owner**: Enter auth token + agency ID → See all models
2. **Select Model**: Click "Start Automation" on a model card
3. **Browser Opens**: AdsPower browser opens with extension loaded
4. **Auto-Login**: Extension automatically logs into Snapchat
5. **Monitor Status**: Check status anytime with "Check Status" button
6. **Stop When Done**: Click "Stop Automation" to close browser

## Files

- **`src/AdsPowerTest.tsx`** - Main React component with model management
- **`README.md`** - This file

## Benefits Over Hardcoded Approach

| Feature | Old (Hardcoded) | New (Production) |
|---------|----------------|------------------|
| Models | Single model only | Multiple models |
| Credentials | Hardcoded in code | Fetched from DB |
| Auth | Hardcoded token | Dynamic token input |
| Scalability | Must edit code | Just add models in DB |
| Team Use | One user | Multiple agencies |
| Security | Tokens in code | Tokens from user input |

## License

Private - WingMan Project
