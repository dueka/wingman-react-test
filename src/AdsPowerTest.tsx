import { useState } from 'react';

// Default configuration
const DEFAULT_BACKEND_URL = 'http://157.245.43.188:3100/api/v1';
const DEFAULT_ADSPOWER_URL = 'http://localhost:50325';

interface ModelData {
  id: string;
  name: string;
  snapchat_username?: string;
  snapchat_password?: string;
  ads_power_profile_id?: string;
  ads_power_browser_status?: string;
}

interface Config {
  authToken: string;
  agencyId: string;
  backendUrl: string;
  adsPowerUrl: string;
}

interface ModelCardProps {
  model: ModelData;
  config: Config;
  onLog: (message: string) => void;
}

function ModelCard({ model, config, onLog }: ModelCardProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    profileId: model.ads_power_profile_id || null,
    browserRunning: model.ads_power_browser_status === 'running',
  });

  // ONE-CLICK: Start Automation (creates profile + starts browser)
  const startAutomation = async () => {
    setLoading(true);
    try {
      onLog(`🚀 Starting automation for ${model.name}...`);

      let profileId = status.profileId;

      // Step 1: Create profile if needed
      if (!profileId) {
        onLog(`🆕 Creating AdsPower profile...`);

        const createResponse = await fetch(`${config.adsPowerUrl}/api/v1/user/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: '0',
            name: `${model.name}_${model.id.substring(0, 8)}`,
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
        onLog(`✅ Profile created: ${profileId}`);
      } else {
        onLog(`✅ Using existing profile: ${profileId}`);
      }

      // Step 2: Start browser
      onLog(`🌐 Starting browser...`);

      const startResponse = await fetch(
        `${config.adsPowerUrl}/api/v1/browser/start?user_id=${profileId}&open_tabs=0&ip_tab=1&headless=0`
      );

      const startData = await startResponse.json();

      if (startData.code !== 0) {
        throw new Error(`Failed to start browser: ${startData.msg}`);
      }

      onLog(`✅ Browser started for ${model.name}!`);
      onLog(`   WebSocket: ${startData.data.ws.puppeteer}`);

      setStatus({ profileId, browserRunning: true });

      // Show credentials
      if (model.snapchat_username && model.snapchat_password) {
        onLog('');
        onLog(`🔑 Use these credentials to login:`);
        onLog(`   Username: ${model.snapchat_username}`);
        onLog(`   Password: ${model.snapchat_password}`);
        onLog(`   → Navigate to https://web.snapchat.com and log in`);
      }

      onLog('');
      onLog(`✅ AUTOMATION STARTED for ${model.name}!`);

    } catch (error: any) {
      onLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Stop browser
  const stopBrowser = async () => {
    if (!status.profileId) {
      onLog(`❌ No profile for ${model.name}!`);
      return;
    }

    setLoading(true);
    try {
      onLog(`🛑 Stopping browser for ${model.name}...`);

      const response = await fetch(
        `${config.adsPowerUrl}/api/v1/browser/stop?user_id=${status.profileId}`
      );

      const data = await response.json();

      if (data.code === 0) {
        onLog(`✅ Browser stopped for ${model.name}!`);
        setStatus({ ...status, browserRunning: false });
      } else {
        onLog(`❌ Failed to stop browser: ${data.msg}`);
      }
    } catch (error: any) {
      onLog(`❌ Error stopping browser for ${model.name}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: '2px solid #ddd',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        backgroundColor: '#f9f9f9',
      }}
    >
      {/* Model Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{model.name}</h3>
        <div style={{ fontSize: '12px', color: '#666' }}>
          ID: {model.id.substring(0, 13)}...
        </div>
      </div>

      {/* Credentials */}
      {model.snapchat_username && (
        <div
          style={{
            background: '#fff3cd',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #ffc107',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
            🔑 Snapchat Credentials
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
            <div>Username: <strong>{model.snapchat_username}</strong></div>
            <div>Password: <strong>{model.snapchat_password}</strong></div>
          </div>
        </div>
      )}

      {/* Status */}
      <div
        style={{
          background: '#e7f3ff',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px',
        }}
      >
        <div><strong>Profile ID:</strong> {status.profileId || 'Not created'}</div>
        <div>
          <strong>Browser:</strong>{' '}
          <span style={{ color: status.browserRunning ? '#28a745' : '#dc3545' }}>
            {status.browserRunning ? '🟢 Running' : '🔴 Stopped'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={startAutomation}
          disabled={loading || status.browserRunning}
          style={{
            padding: '12px 32px',
            backgroundColor: status.browserRunning ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || status.browserRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          {loading ? '⏳ Starting...' : status.browserRunning ? '✅ Running' : '🚀 Start Automation'}
        </button>

        <button
          onClick={stopBrowser}
          disabled={loading || !status.browserRunning}
          style={{
            padding: '12px 32px',
            backgroundColor: !status.browserRunning ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !status.browserRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          {loading ? '⏳ Stopping...' : '🛑 Stop'}
        </button>
      </div>
    </div>
  );
}

export default function AdsPowerTest() {
  const [config, setConfig] = useState<Config>({
    authToken: '',
    agencyId: '',
    backendUrl: DEFAULT_BACKEND_URL,
    adsPowerUrl: DEFAULT_ADSPOWER_URL,
  });

  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(true);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const fetchModels = async () => {
    if (!config.authToken || !config.agencyId) {
      addLog('❌ Please enter both Auth Token and Agency ID');
      return;
    }

    setLoading(true);
    try {
      addLog('📡 Fetching models from backend...');

      const response = await fetch(
        `${config.backendUrl}/model/agency_get_models/${config.agencyId}?page=1&size=100`,
        {
          method: 'GET',
          headers: {
            Authorization: config.authToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || response.statusText);
      }

      const result = await response.json();
      const modelsData = result.data?.data || [];

      setModels(modelsData);
      addLog(`✅ Loaded ${modelsData.length} model(s)`);

      if (modelsData.length === 0) {
        addLog('⚠️ No models found for this agency');
      } else {
        modelsData.forEach((model: ModelData) => {
          addLog(`   - ${model.name} (${model.id.substring(0, 8)}...)`);
        });
      }

      setShowConfig(false);
    } catch (error: any) {
      addLog(`❌ Error fetching models: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '8px' }}>WingMan AdsPower Automation Manager</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Client-side multi-model automation control
      </p>

      {/* Configuration Section */}
      <div
        style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '2px solid #dee2e6',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>⚙️ Configuration</h2>
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showConfig ? '▼ Hide' : '▶ Show'}
          </button>
        </div>

        {showConfig && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                  Auth Token *
                </label>
                <input
                  type="text"
                  value={config.authToken}
                  onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                  placeholder="Enter agency auth token"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                  Agency ID *
                </label>
                <input
                  type="text"
                  value={config.agencyId}
                  onChange={(e) => setConfig({ ...config, agencyId: e.target.value })}
                  placeholder="Enter agency UUID"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                  Backend URL
                </label>
                <input
                  type="text"
                  value={config.backendUrl}
                  onChange={(e) => setConfig({ ...config, backendUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                  AdsPower URL
                </label>
                <input
                  type="text"
                  value={config.adsPowerUrl}
                  onChange={(e) => setConfig({ ...config, adsPowerUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <button
              onClick={fetchModels}
              disabled={loading || !config.authToken || !config.agencyId}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !config.authToken || !config.agencyId ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading || !config.authToken || !config.agencyId ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {loading ? '⏳ Loading Models...' : '📥 Fetch Models'}
            </button>
          </>
        )}
      </div>

      {/* Models List */}
      {models.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            🤖 Models ({models.length})
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            ⚠️ Make sure AdsPower is running on <strong>{config.adsPowerUrl}</strong> before starting automation
          </p>
          {models.map((model) => (
            <ModelCard key={model.id} model={model} config={config} onLog={addLog} />
          ))}
        </div>
      )}

      {/* Logs Section */}
      <div
        style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '16px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <strong style={{ color: '#fff' }}>📋 Activity Logs</strong>
          <button
            onClick={clearLogs}
            style={{
              padding: '4px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Clear
          </button>
        </div>
        {logs.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No activity yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
