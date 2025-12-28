import puppeteer from 'puppeteer-core';
import fetch from 'node-fetch';

// Configuration
const ADSPOWER_API_URL = 'http://localhost:50325';
const BACKEND_API_URL = 'http://localhost:3000/api/v1';
const AUTH_TOKEN = '4c17d070-cae7-4fe7-abee-1429e1fa6d44';
const MODEL_ID = '4b1178e1-1749-4ebf-ba28-a989d6308753'; // Emma Wilson

const platformUrls = {
  snapchat: 'https://web.snapchat.com',
  telegram: 'https://web.telegram.org',
  whatsapp: 'https://web.whatsapp.com',
  facebook: 'https://www.facebook.com/messages',
  twitter: 'https://twitter.com/messages',
  instagram: 'https://www.instagram.com/direct/inbox/',
};

async function main() {
  try {
    console.log('📡 Fetching model data from backend...');

    // 1. Fetch model data (including Snapchat credentials)
    const modelResponse = await fetch(`${BACKEND_API_URL}/model/${MODEL_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!modelResponse.ok) {
      throw new Error(`Failed to fetch model: ${modelResponse.statusText}`);
    }

    const modelResult = await modelResponse.json();
    const modelData = modelResult.data;

    console.log(`✅ Loaded model: ${modelData.name}`);

    // Extract Snapchat credentials from API response
    const snapchatUsername = modelData.snapchat_username;
    const snapchatPassword = modelData.snapchat_password;

    if (snapchatUsername && snapchatPassword) {
      console.log(`🔑 Snapchat credentials found: ${snapchatUsername} / ${snapchatPassword}`);
    } else {
      console.log('⚠️ WARNING: No Snapchat credentials configured for this model!');
      console.log('   You will need to manually log in when the browser opens.');
    }

    let profileId = modelData.ads_power_profile_id;

    // 2. Create profile if doesn't exist
    if (!profileId) {
      console.log('🆕 Creating AdsPower profile...');

      const createResponse = await fetch(`${ADSPOWER_API_URL}/api/v1/user/create`, {
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

      const createData = await createResponse.json();

      if (createData.code !== 0) {
        throw new Error(`Failed to create profile: ${createData.msg}`);
      }

      profileId = createData.data.id;
      console.log(`✅ Profile created: ${profileId}`);
    } else {
      console.log(`✅ Using existing profile: ${profileId}`);
    }

    // 3. Start browser (exactly like backend)
    console.log('🌐 Starting browser...');

    const startResponse = await fetch(
      `${ADSPOWER_API_URL}/api/v1/browser/start?user_id=${profileId}&open_tabs=0&ip_tab=1&headless=0`
    );

    const startData = await startResponse.json();

    if (startData.code !== 0) {
      throw new Error(`Failed to start browser: ${startData.msg}`);
    }

    const browserData = startData.data;
    console.log('✅ Browser started!');
    console.log(`   WebSocket: ${browserData.ws.puppeteer}`);

    // 4. Connect to browser via Puppeteer (exactly like backend)
    console.log('🔗 Connecting Puppeteer...');

    const browser = await puppeteer.connect({
      browserWSEndpoint: browserData.ws.puppeteer,
      defaultViewport: null,
    });

    console.log('✅ Puppeteer connected!');

    // 5. Navigate to Snapchat (exactly like backend)
    const platforms = ['snapchat'];
    const existingPages = await browser.pages();
    const activeTabs = [];

    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      const url = platformUrls[platform];

      if (url) {
        console.log(`🌐 Opening ${platform}: ${url}`);

        // Reuse existing page for first platform, create new for others
        const page = i < existingPages.length ? existingPages[i] : await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        activeTabs.push({
          platform: platform,
          url,
          status: 'active',
          last_activity: new Date(),
        });

        console.log(`✅ Opened ${platform}`);
      }
    }

    // 6. Disconnect Puppeteer (keeps browser open - exactly like backend)
    browser.disconnect();
    console.log('✅ Puppeteer disconnected (browser still running)');

    // 7. Report status to backend
    console.log('📤 Reporting status to backend...');

    const statusResponse = await fetch(`${BACKEND_API_URL}/automation/update-status`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_id: MODEL_ID,
        automation_enabled: true,
        browser_status: 'running',
        profile_id: profileId,
        active_tabs: activeTabs
      })
    });

    if (!statusResponse.ok) {
      console.log(`⚠️ Failed to report status: ${statusResponse.statusText}`);
    } else {
      console.log('✅ Status reported to backend');
    }

    console.log('\n✅ AUTOMATION STARTED SUCCESSFULLY!');
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Browser: Running`);
    console.log(`   Active Tabs: ${activeTabs.length}`);

    if (snapchatUsername && snapchatPassword) {
      console.log('\n🔑 Snapchat Login Credentials:');
      console.log(`   Username: ${snapchatUsername}`);
      console.log(`   Password: ${snapchatPassword}`);
      console.log('   → Log in manually in the browser if prompted');
    } else {
      console.log('\n⚠️ No Snapchat credentials configured');
      console.log('   → Browser opened to Snapchat login page');
      console.log('   → You must log in manually');
    }

    console.log('\nℹ️ Browser is now running. AdsPower will keep it open.');
    console.log('ℹ️ To stop: Use AdsPower UI or call /api/v1/browser/stop');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
