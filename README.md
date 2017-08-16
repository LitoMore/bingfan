# bingfan

饭否每日壁纸机器人

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

  "MSS_ACCESS_KEY": "access_key",
  "MSS_SECRET_KEY": "secret_key",
  "MSS_BUCKET": "bucket",
  "MSS_DOMAIN": "http://your_domain.com/",

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

## License

MIT © [LitoMore](https://github.com/LitoMore)
