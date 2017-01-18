const {OAuth} = require('oauth');
const oAuthSignature = require('oauth-signature');
const request = require('request');
const fs = require('fs');
const crawler = require('./crawler');

const {
    CONSUMER_KEY,
    CONSUMER_SECRET,
    OAUTH_TOKEN,
    OAUTH_TOKEN_SECRET
} = require('./config')

const oauth = new OAuth(
    'http://api.fanfou.com/oauth/request_token',
    'http://api.fanfou.com/oauth/access_token',
    CONSUMER_KEY,
    CONSUMER_SECRET,
    '1.0',
    null,
    'HMAC-SHA1'
);

function uploadImage(path, filename, text) {
    const url = 'http://api.fanfou.com/photos/upload.json';
    const method = 'POST';
    const params = {
        oauth_consumer_key: CONSUMER_KEY,
        oauth_token: OAUTH_TOKEN,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_nonce: oauth._getNonce(6),
        oauth_version: '1.0',
    };
    const signature = oAuthSignature.generate(method, url, params, CONSUMER_SECRET, OAUTH_TOKEN_SECRET, {encodeSignature: false});
    const authorizationHeader = oauth._buildAuthorizationHeaders(oauth._sortRequestParams(oauth._makeArrayOfArgumentsHash(params)).concat([['oauth_signature', signature]]));
    const formData = {
        photo: fs.createReadStream(__dirname + path + filename),
        status: text,
    };

    request.post({
        url,
        formData,
        headers: {Authorization: authorizationHeader},
    }, function (err, httpResponse, body) {
        if (err || httpResponse.statusCode !== 200) console.error('Upload failed:', err, body);
        else console.log('Upload successful!', body)
    });
}

crawler.crawl(function (path, filename, text) {
    uploadImage(path, filename, text);
});
