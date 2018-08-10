var Downloader = require('mt-files-downloader');
const fs = require('fs-extra');
var downloader = new Downloader();
//下载文件未完成

let sfiles = async () => {

  const files = await fs.readJson('../json/files.json')

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
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

}

let resumeDownload = async () => {

  const files = await fs.readJson('../json/files.json')

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(await fs.pathExists(file.path))) {
      let dl = downloader.download(file.url, file.path);
      dl.setRetryOptions({
        maxRetries: 3, // Default: 5
        retryInterval: 3000 // Default: 2000
      });
      dl.start();
    }
    if (await fs.pathExists(file.path + '.mtd')) {
      let dl = downloader.resumeDownload(file.url, file.path);
      dl.setRetryOptions({
        maxRetries: 3, // Default: 5
        retryInterval: 3000 // Default: 2000
      });
      dl.start();
    }
  }
}

sfiles()

setInterval(() => {
  sfiles()
}, 600000)
