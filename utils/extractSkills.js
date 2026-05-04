const axios = require('axios');
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

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'PostmanRuntime/7.29.2',
      Host: '',
    },
  };

  const res = await axios.post('https://auth.emsicloud.com/connect/token', data, config).catch(() => undefined);
  if (res !== undefined) {
    return res?.data?.access_token;
  }
  return null;
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

