import axios from 'axios';
import https from 'https';

// Test GigaChat OAuth
const GIGACHAT_AUTH_KEY = 'MDE5YTU1OTItOTk3MS03NDRjLWI4MWEtZWM3M2M1OGFkM2RiOjdkZjZkZGE0LWJlNGMtNGZmZi1hNzU5LWQ0YmI1Y2RiMTM2Zg==';
const GIGACHAT_SCOPE = 'GIGACHAT_API_PERS';
const GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function generateRqUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function testGigaChatOAuth() {
  try {
    const rqUID = generateRqUID();
    const params = new URLSearchParams();
    params.append('scope', GIGACHAT_SCOPE);
    
    console.log('Testing GigaChat OAuth...');
    console.log('URL:', GIGACHAT_OAUTH_URL);
    console.log('RqUID:', rqUID);
    console.log('Scope:', GIGACHAT_SCOPE);
    console.log('Auth Key length:', GIGACHAT_AUTH_KEY.length);
    console.log('Body:', params.toString());
    
    const response = await axios.post(
      GIGACHAT_OAUTH_URL,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': rqUID,
          'Authorization': `Basic ${GIGACHAT_AUTH_KEY}`,
        },
        httpsAgent: httpsAgent,
        validateStatus: (status) => status < 500,
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data?.access_token) {
      console.log('✅ Success! Access token obtained');
      console.log('Token (first 20 chars):', response.data.access_token.substring(0, 20) + '...');
      console.log('Expires at:', response.data.expires_at);
    } else {
      console.error('❌ Failed to get access token');
      console.error('Status:', response.status);
      console.error('Data:', response.data);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGigaChatOAuth();

