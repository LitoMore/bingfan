'use strict';

const http = require('http');
const qs = require('querystring');
const async = require('async');
const fs = require('fs');
const MSS = require('mss-sdk');
const crypto = require('crypto');

const {
    LOCAL_PATH,
    MSS_ACCESS_KEY,
    MSS_SECRET_KEY,
    MSS_BUCKET,
    MSS_DOMAIN,
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

exports.crawl = function (callback) {
    async.parallel({
        // 请求壁纸接口
        img: function (callback) {
            getImg(callback);
        },
        // 请求简介接口
        text: function (callback) {
            getText(callback);
        },
        // 读取配置
        config: function (callback) {
            getConfig(callback);
        }
    }, function (request_err, request_result) {
        if (!request_err) {
            bing_image.url = request_result.img.url;
            bing_image.filename = request_result.img.fullstartdate + '.jpg';
            async.parallel({
                // 下载图片
                download: function (callback) {
                    downloadImage(callback);
                },
                // 准备本地文件夹
                local_dir: function (callback) {
                    initLocalDir(callback);
                }
            }, function (crawler_err, crawler_result) {
                bing_image.data = crawler_result.download;
                if (!crawler_err) {
                    async.parallel({
                        // 保存文件到本地
                        save: function (callback) {
                            localSave(callback);
                        },
                        // 准备美团云
                        mss_init: function (callback) {
                            mssInit(callback);
                        }
                    }, function (save_err, save_result) {
                        if (!save_err) {
                            mss_config.s3 = save_result.mss_init;
                            bing_image.md5 = save_result.save;
                            bing_image.content = request_result.img.copyright.replace(/ \((.+)\)/g, '（$1）') + MSS_DOMAIN + bing_image.md5 + '.jpg';
                            async.parallel({
                                mssPut: function (callback) {
                                    mssPutFile(callback);
                                }
                            }, function (save_err, save_result) {
                                if (!save_err) {
                                    console.log('Done!');
                                    callback(LOCAL_PATH, bing_image.filename, bing_image.content);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

// 获取图片
function getImg(callback) {
    http.request(options_1, function (res) {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            callback(null, JSON.parse(data).images[0]);
        });
    }).on('error', function (e) {
        console.log('Error: ' + e.message);
    }).end();
}

// 获取简介
function getText(callback) {
    http.request(options_2, function (res) {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            callback(null, JSON.parse(data));
        });
    }).on('error', function (e) {
        console.log('Error: ' + e.message);
    }).end();
}

// 获取配置
function getConfig(callback) {
    fs.readFile(__dirname + '/config.json', 'utf-8', function (read_err, read_result) {
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
    http.request(download_option, function (res) {
        let data = '';
        res.setEncoding('binary');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            callback(null, data);
        });
    }).on('error', function (e) {
        console.log('Error: ' + e.message);
    }).end();
}

// 准备本地文件夹
function initLocalDir(callback) {
    fs.exists(__dirname + LOCAL_PATH, function (exist) {
        if (!exist) {
            fs.mkdir(__dirname + LOCAL_PATH, function (mkdir_err, mkdir_result) {
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
        function (fs_err) {
            if (!fs_err) {
                // 取得文件 MD5 值
                const rs = fs.createReadStream(__dirname + LOCAL_PATH + bing_image.filename);
                const hash = crypto.createHash('md5');
                rs.on('data', hash.update.bind(hash));
                rs.on('end', function () {
                    callback(null, hash.digest('hex'));
                });
            }
        }
    );
}

// 准备美团云
function mssInit(callback) {
    const s3 = new MSS.S3({
        accessKeyId: MSS_ACCESS_KEY,
        secretAccessKey: MSS_SECRET_KEY,
    });
    callback(null, s3);
}

// 保存文件至美团云
function mssPutFile(callback) {
    const fileBuffer = fs.readFileSync(__dirname + LOCAL_PATH + bing_image.filename);
    mss_config.s3.putObject({
        Bucket: MSS_BUCKET,
        Key: bing_image.md5 + '.jpg',
        Body: fileBuffer,
        ContentType: 'image/jpeg',
    }, function (err, ret) {
        if (!err) {
            console.log('Meituan saved.');
            callback(null, ret);
        }
    });
}
