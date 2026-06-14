fetch('https://habitiq.onrender.com/assets/index-vT0kRTOI.js').then(r => r.text()).then(js => {
    const urls = js.match(/https:\/\/[^\"]+onrender\.com/g) || [];
    console.log(urls.length ? urls : 'Not found');
}).catch(console.error);
