const body = { 'a': 1 };
const fetch = require(`node-fetch`);

fetch('https://httpbin.org/post', {
    method: 'post',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
})
    .then(res => {
        console.log(`first response`);
        res.json()
    })
    .then(json => {
        console.log(`second resonse`)
        console.log(json)
    });