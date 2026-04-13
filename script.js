// --- PKCE Helpers ---
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeVerifierAndChallenge() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array);

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const codeChallenge = base64UrlEncode(digest);

  return { codeVerifier, codeChallenge };
}

// --- Cognito Config ---
const COGNITO_DOMAIN = 'https://us-west-2v03dvdkpl.auth.us-west-2.amazoncognito.com';
const CLIENT_ID = '5904tm4k2caibf3fbfg5l19305';
const REDIRECT_URI = 'https://d221yrhrbif8cn.cloudfront.net';
const TOKEN_ENDPOINT = COGNITO_DOMAIN + '/oauth2/token';
const SCOPES = 'openid email profile';

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', startLogin);
  }

  handleRedirect();
});

async function startLogin() {
  const { codeVerifier, codeChallenge } = await generateCodeVerifierAndChallenge();

  sessionStorage.setItem('pkce_code_verifier', codeVerifier);

  const authUrl = new URL(COGNITO_DOMAIN + '/login');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('code_challenge', codeChallenge);

  window.location = authUrl.toString();
}

function handleRedirect() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');

  if (!code) return;

  // Clean URL
  url.searchParams.delete('code');
  window.history.replaceState({}, document.title, url.toString());

  exchangeCodeForTokens(code);
}

async function exchangeCodeForTokens(code) {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) {
    console.error('Missing PKCE code verifier');
    return;
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', CLIENT_ID);
  body.set('code', code);
  body.set('redirect_uri', REDIRECT_URI);
  body.set('code_verifier', codeVerifier);

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!resp.ok) {
    console.error('Token exchange failed', await resp.text());
    return;
  }

  const tokens = await resp.json();

  sessionStorage.setItem('id_token', tokens.id_token);
  sessionStorage.setItem('access_token', tokens.access_token);

  console.log('Logged in:', tokens);
}

async function callProtectedApi() {
  const accessToken = sessionStorage.getItem('access_token');
  if (!accessToken) {
    console.error('Not logged in');
    return;
  }

  const resp = await fetch('https://m7steuvmcj.execute-api.us-west-2.amazonaws.com/properties', {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  });

  const data = await resp.json();
  console.log('API response:', data);
}




function scrollToSection() {
  document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
}
const PROPERTIES_API_URL = "https://m7steuvmcj.execute-api.us-west-2.amazonaws.com/properties";
async function loadProperties(event) {
  if (event) event.preventDefault();

  const loadingEl = document.getElementById("properties-loading");
  const errorEl = document.getElementById("properties-error");
  const listEl = document.getElementById("property-list");

  loadingEl.style.display = "block";
  errorEl.style.display = "none";
  listEl.innerHTML = "";

  try {
	const accessToken = sessionStorage.getItem('access_token');

const res = await fetch(PROPERTIES_API_URL, {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});

	  if (!res.ok) throw new Error("API error");

    const items = await res.json();

    items.forEach(p => {
      const card = document.createElement("div");
      card.className = "property-card";

      card.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <div class="property-info">
          <h3>${p.title}</h3>
          <p>£${Number(p.price).toLocaleString()} • ${p.location}</p>
        </div>
      `;

      listEl.appendChild(card);
    });

  } catch (err) {
    errorEl.style.display = "block";
  } finally {
    loadingEl.style.display = "none";
    document.getElementById("properties").scrollIntoView({ behavior: "smooth" });
  }
}


