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

Config your UpYun account in `config.json`

```
{
  "UPYUN_BUCKET_NAME": "bucket_name",
  "UPYUN_OPERATOR_NAME": "operator_name",
  "UPYUN_OPERATOR_PWD": "operator_pwd",
  "LOCAL_PATH": "/images/",
  "UPYUN_PATH": "/node_images/",
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

Done!
