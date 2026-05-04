const { proxyGenerator } = require('./proxy');
const proxy_check = require('proxy-check');

const checkProxy = async (proxy) => {
  try {
    return await proxy_check(proxy);
  } catch (error) {
    return false;
  }
};

const provider = async () => {
  const proxies = await proxyGenerator();
  const res = await Promise.all(
    proxies.map(async (proxy) => {
      const c = await checkProxy(proxy);
      if (c) {
        return proxy;
      }
      return undefined;
    })
  );

  return res.filter((el) => el !== undefined);
};

module.exports = {
  provider,
};

