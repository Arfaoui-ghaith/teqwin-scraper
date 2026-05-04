const getRemote = (ch) => {
  const elements = ['à distance', 'a distance', 'remote', 'remotly'];
  ch = (ch || '').toLowerCase();
  for (const el of elements) {
    if (ch.indexOf(el) > -1) return true;
  }
  return false;
};

module.exports = {
  getRemote,
};

