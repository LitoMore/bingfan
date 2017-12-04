const fs = require('fs');
const Fanfou = require('fanfou-sdk');
const crawler = require('./crawler');
const schedule = require('node-schedule');

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  OAUTH_TOKEN,
  OAUTH_TOKEN_SECRET,
} = require('./config');

const ff = new Fanfou({
  auth_type: 'oauth',
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  oauth_token: OAUTH_TOKEN,
  oauth_token_secret: OAUTH_TOKEN_SECRET,
  protocol: 'https:',
  fakeHttps: true
});

function uploadImage(path, filename, text) {
  ff.upload(fs.createReadStream(__dirname + path + filename), text, (e, status, rawData) => {
    if (e) console.error(e);
    else console.log(rawData);
  });
}

schedule.scheduleJob('0 1 * * *', () => {
  crawler.crawl((path, filename, text) => {
    uploadImage(path, filename, text);
  });
})
