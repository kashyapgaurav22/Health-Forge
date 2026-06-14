const https = require('https');
https.get('https://takeuforward.org/profile/kashyap_gaurav22', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    // Next.js static props or App Router payload
    const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (match) {
      const json = JSON.parse(match[1]);
      console.log(JSON.stringify(json.props.pageProps, null, 2).substring(0, 1000));
    } else {
      console.log('No NEXT_DATA found');
      // Look for other JSON payloads
      const match2 = data.match(/self\.__next_f\.push\(\[1,"([^"]+)"\]\)/g);
      if (match2) {
          console.log('Found App router data');
          match2.forEach(m => console.log(m.substring(0, 100)));
      }
    }
  });
});
