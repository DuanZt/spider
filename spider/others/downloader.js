var Downloader = require('mt-files-downloader');
var downloader = new Downloader();
const fs = require('fs-extra');
//下载文件未完成

exports.sfile = async (file) => {
  if (!(await fs.pathExists(file.path))) {
    let dl = downloader.download(file.url, file.path);
    dl.setRetryOptions({
      maxRetries: 3, // Default: 5
      retryInterval: 3000 // Default: 2000
    });
    dl.on('error', function () {
      console.log(dl.error)
    });
    dl.start();
  }
}
