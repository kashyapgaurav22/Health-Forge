const https = require('https');
https.get('https://health-forge-pi.vercel.app/', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const match = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (match) {
      const jsUrl = 'https://health-forge-pi.vercel.app' + match[1];
      console.log('Fetching:', jsUrl);
      https.get(jsUrl, (res2) => {
        let jsData = '';
        res2.on('data', d => jsData += d);
        res2.on('end', () => {
          console.log('Contains localhost:', jsData.includes('localhost:5000'));
          console.log('Contains render:', jsData.includes('health-forge.onrender.com'));
        });
      });
    } else {
      console.log('No JS bundle found');
    }
  });
});
