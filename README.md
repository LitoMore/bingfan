# bingfan

Bing-Wallpaper Bot for Fanfou

## Usage

Clone this project and install packages

```
$ git clone https://github.com/LitoMore/bingfan.git
$ cd bingfan
$ npm install
```

Create the config file

```
$ cp config.json.example config.json
```

Config your MSS account in `config.json`

```
{
  "LOCAL_PATH": "/images/",
  "CONSUMER_KEY": "",
  "CONSUMER_SECRET": "",
  "OAUTH_TOKEN": "",
  "OAUTH_TOKEN_SECRET": ""
}
```

Run `app.js`

```
$ node app.js
```

## Related

- [fanfou-sdk](https://github.com/LitoMore/fanfou-sdk-node) - Fanfou SDK for Node.js
- [node-bing-crawler](https://github.com/LitoMore/node-bing-crawler) - Bing wallpaper crawler

## License

MIT © [LitoMore](https://github.com/LitoMore)
