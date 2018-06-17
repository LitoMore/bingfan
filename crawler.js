'use strict';

const http = require('http');
const qs = require('querystring');
const async = require('async');
const fs = require('fs');
const MSS = require('mss-sdk');
const crypto = require('crypto');

const {
  LOCAL_PATH
} = require('./config');

// 无水印壁纸接口
const options_1 = {
  method: 'GET',
  hostname: 'cn.bing.com',
  port: 80,
  path: '/HPImageArchive.aspx?' + qs.stringify({
    format: 'js',
    idx: 0,
    n: 1
  })
};

// 带壁纸简介的接口
const options_2 = {
  method: 'GET',
  hostname: 'cn.bing.com',
  port: 80,
  path: '/cnhp/coverstory/'
};

const bing_image = {
  url: null,
  filename: null,
  data: null,
  content: null,
  md5: null,
};

const mss_config = {
  s3: null
};

exports.crawl = (callback) => {
  async.parallel({
    // 请求壁纸接口
    img: (callback) => {
      getImg(callback);
    },
    // 请求简介接口
    text: (callback) => {
      getText(callback);
    },
    // 读取配置
    config: (callback) => {
      getConfig(callback);
    }
  }, (request_err, request_result) => {
    if (request_err) {
      console.log(request_err);
    } else {
      console.log('Requesting')
      bing_image.url = request_result.img.url;
      bing_image.filename = request_result.img.fullstartdate + '.jpg';
      async.parallel({
        // 下载图片
        download: (callback) => {
          console.log('Downloading')
          downloadImage(callback);
        },
        // 准备本地文件夹
        local_dir: (callback) => {
          console.log('Preparing')
          initLocalDir(callback);
        }
      }, (crawler_err, crawler_result) => {
        bing_image.data = crawler_result.download;
        if (crawler_err) {
          console.log(crawler_err)
        } else {
          async.parallel({
            // 保存文件到本地
            save: (callback) => {
              console.log('Saving')
              localSave(callback);
            },
          }, (save_err, save_result) => {
            if (save_err) {
              console.log(save_err)
            } else {
              console.log('Naming')
              bing_image.md5 = save_result.save;
              bing_image.content = request_result.img.copyright;
              callback(LOCAL_PATH, bing_image.filename, bing_image.content);
            }
          });
        }
      });
    }
  });
};

// 获取图片
function getImg(callback) {
  http.request(options_1, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(null, JSON.parse(data).images[0]);
    });
  }).on('error', (e) => {
    console.log('Error: ' + e.message);
  }).end();
}

// 获取简介
function getText(callback) {
  http.request(options_2, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(null, JSON.parse(data));
    });
  }).on('error', (e) => {
    console.log('Error: ' + e.message);
  }).end();
}

// 获取配置
function getConfig(callback) {
  fs.readFile(__dirname + '/config.json', 'utf-8', (read_err, read_result) => {
    if (!read_err) {
      callback(null, JSON.parse(read_result));
    }
  });
}

// 下载图片
function downloadImage(callback) {
  const download_option = {
    method: 'GET',
    hostname: 'cn.bing.com',
    port: 80,
    path: bing_image.url
  };
  http.request(download_option, (res) => {
    let data = '';
    res.setEncoding('binary');
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(null, data);
    });
  }).on('error', (e) => {
    console.log('Error: ' + e.message);
  }).end();
}

// 准备本地文件夹
function initLocalDir(callback) {
  fs.exists(__dirname + LOCAL_PATH, (exist) => {
    if (!exist) {
      fs.mkdir(__dirname + LOCAL_PATH, (mkdir_err, mkdir_result) => {
        if (!mkdir_err) {
          callback(null, mkdir_result);
        }
      });
    } else {
      callback(null, exist);
    }
  });
}

// 保存文件到本地
function localSave(callback) {
  fs.writeFile(
    __dirname + LOCAL_PATH + bing_image.filename,
    bing_image.data,
    'binary',
    (fs_err) => {
      if (!fs_err) {
        // 取得文件 MD5 值
        const rs = fs.createReadStream(__dirname + LOCAL_PATH + bing_image.filename);
        const hash = crypto.createHash('md5');
        rs.on('data', hash.update.bind(hash));
        rs.on('end', () => {
          console.log('Save end')
          callback(null, hash.digest('hex'));
        });
      }
    }
  );
}
