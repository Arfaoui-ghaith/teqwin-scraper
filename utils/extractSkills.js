const qs = require('qs');
const { emsi } = require('./keys');
const { call } = require('./httpClient');

const generateToken = async (key) => {
  const data = qs.stringify({
    client_id: key.client,
    client_secret: key.secret,
    grant_type: 'client_credentials',
    scope: 'emsi_open',
  });

  let res;
  try {
    res = await fetch('https://auth.emsicloud.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PostmanRuntime/7.29.2',
      },
      body: data,
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;
  try {
    const json = await res.json();
    return json?.access_token ?? null;
  } catch {
    return null;
  }
};

const extract = async (text) => {
  const keys = emsi();
  for (const key of keys) {
    const token = await generateToken(key);
    if (token != null) {
      const res = await call('https://emsiservices.com/skills/versions/latest/extract', {
        method: 'post',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      }).catch((er) => console.log(er));

      if (res.status === 200) {
        return JSON.parse(res.data).data.map((el) => el.skill.name);
      }
    }
  }
  return [];
};

module.exports = {
  extract,
};

