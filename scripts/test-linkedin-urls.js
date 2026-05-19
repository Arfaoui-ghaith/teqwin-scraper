require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const collect = require('../services/linkedin/urls');

collect()
  .then((urls) => {
    console.log('Total URLs:', urls.length);
    urls.slice(0, 15).forEach((u, i) => console.log(`${i + 1}. ${u}`));
    if (urls.length > 15) console.log(`... and ${urls.length - 15} more`);
  })
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
