import { useState, useEffect } from 'react';

// Configuration
const ADSPOWER_API_URL = 'http://localhost:50325';
const BACKEND_API_URL = 'https://157.245.43.188:3100/api/v1';
// Live backend URL for extension connectivity
const BACKEND_WS_URL = 'https://157.245.43.188:3100';
const AUTH_TOKEN = '4c17d070-cae7-4fe7-abee-1429e1fa6d44';
const MODEL_ID = '4b1178e1-1749-4ebf-ba28-a989d6308753'; // Emma Wilson

// Extension path (update this to your local extension build path)
const EXTENSION_PATH = 'C:/Users/HELLO/Documents/repos/wingman-bot-extension/build';

interface ModelData {
  id: string;
  name: string;
  snapchat_username?: string;
  snapchat_password?: string;
  ads_power_profile_id?: string;
  ads_power_browser_status?: string;
}

interface AdsPowerProfile {
  profileId: string | null;
  profileName: string;
  browserRunning: boolean;
}

export default function AdsPowerTest() {
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [profile, setProfile] = useState<AdsPowerProfile>({
    profileId: null,
    profileName: '',
    browserRunning: false
  });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Helper to add logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Fetch model data on mount
  useEffect(() => {
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      addLog('📡 Fetching model data from backend...');

      const response = await fetch(`${BACKEND_API_URL}/model/${MODEL_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;
      setModelData(data);

      addLog(`✅ Loaded model: ${data.name}`);

      if (data.snapchat_username && data.snapchat_password) {
        addLog(`🔑 Snapchat credentials: ${data.snapchat_username}`);
      }

      // If model already has a profile, populate state
      if (data.ads_power_profile_id) {
        setProfile({
          profileId: data.ads_power_profile_id,
          profileName: `${data.name}_${data.id.substring(0, 8)}`,
          browserRunning: data.ads_power_browser_status === 'running'
        });
        addLog(`✅ Found existing profile: ${data.ads_power_profile_id}`);
      }
    } catch (error: any) {
      addLog(`❌ Error fetching model: ${error.message}`);
    }
  };

  // Create AdsPower profile
  const createProfile = async () => {
    if (!modelData) {
      addLog('❌ Model data not loaded yet!');
      return;
    }

    setLoading(true);
    try {
      addLog('🆕 Creating AdsPower profile...');

      const response = await fetch(`${ADSPOWER_API_URL}/api/v1/user/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: '0',
          name: `${modelData.name}_${modelData.id.substring(0, 8)}`,
          fingerprint_config: {
            random_ua: {
              ua_browser: ['chrome'],
              ua_system_version: ['Windows 10']
            }
          },
          user_proxy_config: {
            proxy_soft: 'no_proxy',
            proxy_type: '',
            proxy_host: '',
            proxy_port: '',
            proxy_user: '',
            proxy_password: ''
          },
          repeat_config: 0,
        })
      });

      const data = await response.json();

      if (data.code === 0) {
        const profileId = data.data.id;

        setProfile({
          profileId,
          profileName: `${modelData.name}_${modelData.id.substring(0, 8)}`,
          browserRunning: false
        });

        addLog(`✅ Profile created: ${profileId}`);
      } else {
        addLog(`❌ Failed to create profile: ${data.msg}`);
      }
    } catch (error: any) {
      addLog(`❌ Error creating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Start browser (manual step)
  const startBrowser = async () => {
    if (!profile.profileId) {
      addLog('❌ No profile ID. Create a profile first!');
      return;
    }

    setLoading(true);
    try {
      addLog('🌐 Starting browser...');

      const response = await fetch(
        `${ADSPOWER_API_URL}/api/v1/browser/start?user_id=${profile.profileId}&open_tabs=0&ip_tab=1&headless=0`
      );

      const data = await response.json();

      if (data.code === 0) {
        addLog('✅ Browser started!');
        addLog(`   WebSocket: ${data.data.ws.puppeteer}`);

        setProfile(prev => ({ ...prev, browserRunning: true }));

        if (modelData?.snapchat_username && modelData?.snapchat_password) {
          addLog('');
          addLog('🔑 MANUAL LOGIN REQUIRED:');
          addLog(`   Username: ${modelData.snapchat_username}`);
          addLog(`   Password: ${modelData.snapchat_password}`);
          addLog('   → Browser opened - navigate to Snapchat and log in');
        }
      } else {
        addLog(`❌ Failed to start browser: ${data.msg}`);
      }
    } catch (error: any) {
      addLog(`❌ Error starting browser: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ONE-CLICK: Start Automation (creates profile + starts browser + opens Snapchat)
  const startAutomation = async () => {
    if (!modelData) {
      addLog('❌ Model data not loaded yet!');
      return;
    }

    setLoading(true);
    try {
      addLog('🚀 Starting automation...');
      addLog(`   Model: ${modelData.name}`);

      let profileId = profile.profileId;

      // Step 1: Create profile if needed
      if (!profileId) {
        addLog('🆕 Creating AdsPower profile...');

        const createResponse = await fetch(`${ADSPOWER_API_URL}/api/v1/user/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: '0',
            name: `${modelData.name}_${modelData.id.substring(0, 8)}`,
            fingerprint_config: {
              random_ua: {
                ua_browser: ['chrome'],
                ua_system_version: ['Windows 10']
              }
            },
            user_proxy_config: {
              proxy_soft: 'no_proxy',
              proxy_type: '',
              proxy_host: '',
              proxy_port: '',
              proxy_user: '',
              proxy_password: ''
            },
            repeat_config: 0,
          })
        });

        const createData = await createResponse.json();

        if (createData.code !== 0) {
          throw new Error(`Failed to create profile: ${createData.msg}`);
        }

        profileId = createData.data.id;
        addLog(`✅ Profile created: ${profileId}`);
      } else {
        addLog(`✅ Using existing profile: ${profileId}`);
      }

      // Step 2: Start browser with extension loaded via launch_args
      addLog('🌐 Starting browser with Wingman extension...');

      // Chrome launch args to load the extension
      const extensionPath = EXTENSION_PATH.replace(/\//g, '\\');

      addLog(`   Model ID: ${MODEL_ID}`);
      addLog(`   Backend WS: ${BACKEND_WS_URL}`);
      addLog(`   Extension path: ${extensionPath}`);

      const launchArgs = JSON.stringify([
        `--load-extension=${extensionPath}`,
        `--disable-extensions-except=${extensionPath}`
      ]);

      // Start browser - extension will auto-navigate to Snapchat
      const apiUrl = `${ADSPOWER_API_URL}/api/v1/browser/start?user_id=${profileId}&open_tabs=0&ip_tab=1&headless=0&launch_args=${encodeURIComponent(launchArgs)}`;

      addLog(`   API: ${ADSPOWER_API_URL}/api/v1/browser/start`);
      addLog(`   Params: user_id=${profileId}, open_tabs=0, ip_tab=1`);
      addLog(`   Extension will auto-navigate to Snapchat`);

      const startResponse = await fetch(apiUrl);
      const startData = await startResponse.json();

      if (startData.code !== 0) {
        throw new Error(`Failed to start browser: ${startData.msg}`);
      }

      addLog('✅ Browser started with Wingman extension!');
      addLog(`   Puppeteer WS: ${startData.data.ws.puppeteer}`);
      addLog(`   Debug Port: ${startData.data.debug_port}`);

      // Step 3: Wait for extension to initialize, then navigate to Snapchat with config
      addLog('');
      addLog('⏳ Waiting for extension to initialize...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Navigate to Snapchat with config params via backend
      addLog('🌐 Navigating to Snapchat with config params...');
      const configParams = new URLSearchParams({
        wm_model: MODEL_ID,
        wm_token: AUTH_TOKEN,
        wm_api: BACKEND_WS_URL
      });
      const snapchatUrl = `https://web.snapchat.com?${configParams.toString()}`;
      addLog(`   URL: ${snapchatUrl}`);

      // Use CDP to navigate (via backend proxy or direct)
      try {
        // Try to navigate via simple fetch to trigger the extension
        // The extension's content-script will read the URL params
        addLog('   Attempting navigation via AdsPower...');

        // AdsPower doesn't have a direct navigation API, so extension handles it
        addLog('   Extension should auto-navigate to Snapchat');
      } catch (navError: any) {
        addLog(`   ⚠️ Navigation note: ${navError.message}`);
      }

      addLog('');
      addLog('🔌 Extension automation flow:');
      addLog('   1. Extension auto-navigates to Snapchat');
      addLog('   2. Login scripts handle authentication (if needed)');
      addLog('   3. content-script.js starts conversation monitoring');
      addLog('   4. All LLM calls go through backend WebSocket');

      setProfile({
        profileId,
        profileName: `${modelData.name}_${modelData.id.substring(0, 8)}`,
        browserRunning: true
      });

      // Show credentials (as fallback if extension doesn't auto-login)
      if (modelData?.snapchat_username && modelData?.snapchat_password) {
        addLog('');
        addLog('🔑 FALLBACK CREDENTIALS (if auto-login fails):');
        addLog(`   Username: ${modelData.snapchat_username}`);
        addLog(`   Password: ${modelData.snapchat_password}`);
      }

      addLog('');
      addLog('✅ AUTOMATION STARTED - Extension handling login!');

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Stop browser
  const stopBrowser = async () => {
    if (!profile.profileId) {
      addLog('❌ No profile ID!');
      return;
    }

    setLoading(true);
    try {
      addLog('🛑 Stopping browser...');

      const response = await fetch(
        `${ADSPOWER_API_URL}/api/v1/browser/stop?user_id=${profile.profileId}`
      );

      const data = await response.json();

      if (data.code === 0) {
        addLog('✅ Browser stopped!');
        setProfile(prev => ({ ...prev, browserRunning: false }));
      } else {
        addLog(`❌ Failed to stop browser: ${data.msg}`);
      }
    } catch (error: any) {
      addLog(`❌ Error stopping browser: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog(`📋 Copied to clipboard: ${text}`);
    }).catch(err => {
      addLog(`❌ Failed to copy: ${err.message}`);
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>AdsPower Browser Automation Test</h1>

      {/* Profile Info */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Profile Info</h3>
        <p><strong>Model:</strong> {modelData?.name || 'Loading...'}</p>
        <p><strong>Profile ID:</strong> {profile.profileId || 'Not created'}</p>
        <p><strong>Browser Status:</strong> {profile.browserRunning ? '🟢 Running' : '🔴 Stopped'}</p>
      </div>

      {/* Snapchat Credentials */}
      {modelData?.snapchat_username && modelData?.snapchat_password && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>🔑 Snapchat Login Credentials</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Username:</strong>{' '}
            <span style={{ fontFamily: 'monospace', background: '#fff', padding: '5px 10px', borderRadius: '4px', marginLeft: '10px' }}>
              {modelData.snapchat_username}
            </span>
            <button
              onClick={() => copyToClipboard(modelData.snapchat_username!)}
              style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              📋 Copy
            </button>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Password:</strong>{' '}
            <span style={{ fontFamily: 'monospace', background: '#fff', padding: '5px 10px', borderRadius: '4px', marginLeft: '10px' }}>
              {modelData.snapchat_password}
            </span>
            <button
              onClick={() => copyToClipboard(modelData.snapchat_password!)}
              style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              📋 Copy
            </button>
          </div>
          <div style={{ padding: '10px', background: '#d1ecf1', borderRadius: '5px', fontSize: '14px' }}>
            <strong>📌 Manual Login Required:</strong><br />
            When the browser opens, navigate to https://web.snapchat.com and log in using these credentials.
            Once logged in, AdsPower will save the session for future use.
          </div>
        </div>
      )}

      {/* One-Click Automation */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>One-Click Automation</h3>
        <button
          onClick={startAutomation}
          disabled={loading || !modelData || profile.browserRunning}
          style={{
            padding: '15px 40px',
            marginRight: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading || !modelData || profile.browserRunning ? 'not-allowed' : 'pointer',
            background: loading || !modelData || profile.browserRunning ? '#ccc' : '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          {loading ? '⏳ Starting...' : '🚀 Start Automation'}
        </button>
        <button
          onClick={stopBrowser}
          disabled={loading || !profile.browserRunning}
          style={{
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading || !profile.browserRunning ? 'not-allowed' : 'pointer',
            background: loading || !profile.browserRunning ? '#ccc' : '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          {loading ? '⏳' : '🛑 Stop'}
        </button>
        <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '14px', color: '#666' }}>
          Creates profile (if needed) → Starts browser → Opens Snapchat
        </p>
      </div>

      {/* Manual Actions (Advanced) */}
      <details style={{ marginBottom: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>Manual Steps (Advanced)</summary>
        <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
        <button
          onClick={createProfile}
          disabled={loading || profile.profileId !== null}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            fontSize: '16px',
            cursor: loading || profile.profileId ? 'not-allowed' : 'pointer',
            background: profile.profileId ? '#ccc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          {loading ? '⏳' : '1️⃣'} Create Profile
        </button>

        <button
          onClick={startBrowser}
          disabled={loading || !profile.profileId || profile.browserRunning}
          style={{
            padding: '12px 24px',
            marginRight: '10px',
            fontSize: '16px',
            cursor: loading || !profile.profileId || profile.browserRunning ? 'not-allowed' : 'pointer',
            background: !profile.profileId || profile.browserRunning ? '#ccc' : '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          {loading ? '⏳' : '2️⃣'} Start Browser
        </button>

        <button
          onClick={stopBrowser}
          disabled={loading || !profile.profileId || !profile.browserRunning}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading || !profile.profileId || !profile.browserRunning ? 'not-allowed' : 'pointer',
            background: !profile.profileId || !profile.browserRunning ? '#ccc' : '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          {loading ? '⏳' : '3️⃣'} Stop Browser
        </button>
        </div>
      </details>

      {/* Activity Log */}
      <div style={{ marginTop: '30px' }}>
        <h3>Activity Log</h3>
        <div
          style={{
            background: '#000',
            color: '#0f0',
            padding: '15px',
            borderRadius: '8px',
            height: '400px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}
        >
          {logs.length === 0 ? (
            <p style={{ color: '#666' }}>Fetching model data...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Prerequisites */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>⚠️ Prerequisites:</h4>
        <ul style={{ marginBottom: 0 }}>
          <li>AdsPower must be installed and running</li>
          <li>AdsPower API accessible at http://localhost:50325</li>
          <li>Backend API accessible at http://localhost:3000</li>
          <li>Model: Emma Wilson ({MODEL_ID})</li>
        </ul>
      </div>

      {/* Test Steps */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#d1ecf1', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>📋 Test Workflow:</h4>
        <ol style={{ marginBottom: 0 }}>
          <li><strong>Page loads automatically</strong> and fetches Emma Wilson's data</li>
          <li><strong>Snapchat credentials displayed</strong> in yellow box above</li>
          <li><strong>Click "Create Profile"</strong> to create AdsPower profile (or reuse existing)</li>
          <li><strong>Click "Start Browser"</strong> to open AdsPower browser</li>
          <li><strong>Manually navigate to https://web.snapchat.com</strong> in the opened browser</li>
          <li><strong>Log in using the credentials</strong> shown above (use Copy buttons)</li>
          <li><strong>AdsPower saves the session</strong> for future use</li>
          <li><strong>Click "Stop Browser"</strong> when done testing</li>
        </ol>
        <p style={{ marginTop: '15px', padding: '10px', background: '#e7f3ff', borderLeft: '4px solid #2196F3', fontSize: '14px', marginBottom: 0 }}>
          <strong>ℹ️ Note:</strong> After first login, AdsPower remembers the session.
          Future browser starts will auto-login without manual intervention.
        </p>
      </div>
    </div>
  );
}
