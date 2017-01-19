'use strict';

const http = require('http');
const qs = require('querystring');
const async = require('async');
const fs = require('fs');
const UpYun = require('upyun');

const {
    UPYUN_BUCKET_NAME,
    UPYUN_OPERATOR_NAME,
    UPYUN_OPERATOR_PWD,
    LOCAL_PATH,
    UPYUN_PATH,
    UPYUN_DOMAIN,
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
    content: null
};

const upyun_config = {
    upyun: null
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
            bing_image.content = request_result.img.copyright.replace(/ \((.+)\)/g, '（$1）') + UPYUN_DOMAIN + UPYUN_PATH + bing_image.filename;
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
                        // 准备又拍云
                        upyun_init: function (callback) {
                            upyunInit(callback);
                        }
                    }, function (save_err, save_result) {
                        if (!save_err) {
                            upyun_config.upyun = save_result.upyun_init;
                            async.parallel({
                                // 保存图片至又拍云
                                put: function (callback) {
                                    upyunPutFile(callback);
                                }
                            }, function (save_err, save_result) {
                                if (!save_err) {
                                    console.log('UpYun saved.');
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
                callback(null, 'Saved!');
            }
        }
    );
}

// 准备又拍云
function upyunInit(callback) {
    const upyun = new UpYun(
        UPYUN_BUCKET_NAME,
        UPYUN_OPERATOR_NAME,
        UPYUN_OPERATOR_PWD,
        'v0.api.upyun.com', {
            apiVersion: 'v2'
        }
    );
    upyun.headFile(UPYUN_PATH, function (file_err, file_result) {
        if (!file_err) {
            if (file_result.statusCode === 404) {
                upyun.makeDir(UPYUN_PATH, function (make_dir_err, make_dir_result) {
                    if (!make_dir_err) {
                        callback(null, upyun)
                    }
                });
            } else if (file_result.statusCode === 200) {
                callback(null, upyun)
            } else {
                console.log('Unexpected status code ' + file_result.statusCode);
            }
        }
    });
}

// 保存文件至又拍云
function upyunPutFile(callback) {
    upyun_config.upyun.putFile(
        UPYUN_PATH + bing_image.filename,
        __dirname + LOCAL_PATH + bing_image.filename,
        'image/jpg',
        0,
        null,
        function (put_err, put_result) {
            if (!put_err) {
                callback(null, put_result);
            }
        }
    );
}
