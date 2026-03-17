import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const httpntlm = require('httpntlm');

function splitIdentity(identity, domainOverride) {
  if (!identity) {
    return { username: '', domain: domainOverride || '' };
  }

  if (identity.includes('\\')) {
    const [domain, username] = identity.split('\\', 2);
    return { username, domain };
  }

  return { username: identity, domain: domainOverride || '' };
}

function maybeAllowInsecure(insecure) {
  if (insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

function ensureSuccess(resp, operationName) {
  if (resp.status >= 200 && resp.status < 300) {
    return resp;
  }

  const snippet = (resp.body || '').slice(0, 500).replace(/\s+/g, ' ').trim();
  throw new Error(`${operationName} failed: HTTP ${resp.status}. ${snippet}`);
}

function normalizeResponse(status, headers, body) {
  return {
    status,
    headers: headers || {},
    body: typeof body === 'string' ? body : String(body || ''),
  };
}

function ntlmRequest(method, { url, username, password, domain, headers, body, insecure }) {
  const { username: userOnly, domain: domainOnly } = splitIdentity(username, domain);

  const options = {
    url,
    username: userOnly,
    password,
    domain: domainOnly || '',
    workstation: '',
    headers: headers || {},
    rejectUnauthorized: !insecure,
  };

  if (body !== undefined) {
    options.body = body;
  }

  return new Promise((resolve, reject) => {
    const fn = httpntlm[method];
    if (typeof fn !== 'function') {
      reject(new Error(`Unsupported NTLM method: ${method}`));
      return;
    }

    fn(options, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(normalizeResponse(res.statusCode || 0, res.headers, res.body));
    });
  });
}

export async function ewsGet({ url, username, password, authMode, domain, insecure = false }) {
  const mode = String(authMode || 'ntlm').toLowerCase();

  if (mode === 'basic') {
    maybeAllowInsecure(insecure);
    const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${token}` },
    });
    const body = await resp.text();
    return ensureSuccess(normalizeResponse(resp.status, Object.fromEntries(resp.headers.entries()), body), 'EWS GET');
  }

  const resp = await ntlmRequest('get', {
    url,
    username,
    password,
    domain,
    insecure,
  });
  return ensureSuccess(resp, 'EWS GET');
}

export async function ewsPostSoap({
  url,
  username,
  password,
  authMode,
  domain,
  soapAction,
  soapBody,
  insecure = false,
}) {
  const mode = String(authMode || 'ntlm').toLowerCase();
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    SOAPAction: soapAction,
  };

  if (mode === 'basic') {
    maybeAllowInsecure(insecure);
    const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `Basic ${token}`,
      },
      body: soapBody,
    });
    const body = await resp.text();
    return ensureSuccess(normalizeResponse(resp.status, Object.fromEntries(resp.headers.entries()), body), 'EWS SOAP POST');
  }

  const resp = await ntlmRequest('post', {
    url,
    username,
    password,
    domain,
    headers,
    body: soapBody,
    insecure,
  });
  return ensureSuccess(resp, 'EWS SOAP POST');
}
