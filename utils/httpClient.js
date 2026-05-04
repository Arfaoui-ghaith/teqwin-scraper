const { provider } = require('./proxiesProvider');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const HttpsProxyAgent = require('https-proxy-agent');

const request = async (proxy, url, headers) => {
  const proxyAgent = new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`);
  const response = await fetch(url, {
    agent: proxyAgent,
    ...headers,
  });
  return response;
};

const call = async (url, headers) => {
  try {
    const res0 = await fetch(url, {
      ...headers,
    });
    return { data: await res0.text(), status: res0.status, url };
  } catch (er) {
    console.log(`[http] Direct fetch failed for ${url.slice(0, 50)}..., trying proxies...`);
    const proxies = await provider();
    const responses = (
      await Promise.all(
        proxies.map(async (proxy) => {
          const res = await request(proxy, url, headers).catch(() => null);
          if (res && res.text) {
            return { data: await res.text(), status: 200, url };
          }
          return null;
        })
      )
    ).filter((res) => res !== null);

    if (responses.length > 0) {
      console.log(`[http] Proxy succeeded for ${url.slice(0, 50)}...`);
      return responses[0];
    }
    console.log(`[http] All proxies failed for ${url.slice(0, 50)}...`);
    return { data: '', status: 404, url };
  }
};

module.exports = {
  call,
};

