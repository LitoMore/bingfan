const fs = require('fs');
const Fanfou = require('fanfou-sdk');
const crawler = require('./crawler');

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  OAUTH_TOKEN,
  OAUTH_TOKEN_SECRET,
} = require('./config');

const ff = new Fanfou(
  CONSUMER_KEY,
  CONSUMER_SECRET,
  OAUTH_TOKEN,
  OAUTH_TOKEN_SECRET
);

function uploadImage(path, filename, text) {
  ff.upload(__dirname + path + filename, text, (e, res) => {
    if (e) console.error(e);
    else console.log(res);
  });
}

crawler.crawl((path, filename, text) => {
  uploadImage(path, filename, text);
});
