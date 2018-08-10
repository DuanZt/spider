const createPhantomPool = require('phantom-pool')
const fs = require('fs-extra')
var Downloader = require('mt-files-downloader');
var downloader = new Downloader();
const fsys = require('fs');
const filePath = "../../sites/default/files/page/"
const urlPath = "/ween/sites/default/files/page/"
const cheerio = require('cheerio')
const isFile = /\.(jpg|jpeg|gif|png|pdf|doc|docx|xlsx|xls)/
const isImage = /\.(jpg|jpeg|gif|png)/;
const request = require('request');
const doman = 'http://www.ween-semi.com/'
const pool = createPhantomPool({
  max: 10, // default
  min: 2, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 30000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  phantomArgs: [
    ['--ignore-ssl-errors=true', '--disk-cache=true'], {
      // logLevel: 'debug',
    }
  ], // arguments passed to phantomjs-node directly, default is `[]`. For all opts, see https://github.com/amir20/phantomjs-node#phantom-object-api
});


//页面里还有个静态页面需要爬取

(async () => {
  const products = await fs.readJson('../json/products.json')

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const file_path = '../json/products/' + product.name + '.json';
    if (!await fs.pathExists(file_path)) {
      const data = await sProduct(doman + product.href)
      await fs.outputJSON(file_path, data)
    }

  }


  pool.drain().then(() => pool.clear())
})()


const urlFormat = (url) => {
  return (!url.match(doman) && !url.match('http')) ? doman + url : url;
}


const sProduct = async (url) => {
  console.log(url)
  let data = await pool.use(async (instance) => {
    const page = await instance.createPage()
    const status = await page.open(url, {
      operation: 'GET'
    })
    if (status !== 'success') throw new Error(status)
    const content = await page.property('content')
    const $ = cheerio.load(content)
    const chemical_content_url = $(".quality tbody td:first-child a").length && $(".quality tbody td:first-child a").attr("href")
    console.log(chemical_content_url)
    //make data
    let product = {
      title: $("#showall .overview .ween-blue-fg span").text(),
      description: $("#showall .overview #pipDesc h2").text(),
      chemical_content: '',
      sections: []
    }
    chemical_content_url && (product.chemical_content = await sPage(urlFormat(chemical_content_url)))

    //read section
    let titles = $("#showall .custom-bold").toArray()
    for (let i = 0; i < titles.length; i++) {
      const el = titles[i];

      let $title = $(el).find("span").text()
      let $content = $(el).parent().next()
      //read files links

      $content = await sContent($content, $)

      //format data
      product.sections.push({
        title: $title,
        content: $content.html()
      })
    }

    return product

  })

  return data
}


const sDownload = async (url, flag) => {
  (!url.match(doman) && !url.match('http')) && (url = doman + url);
  let filename = url.split('/').pop().split('?')[0]
  const is_exist = await fs.pathExists(filePath + filename)
  if (!is_exist && flag) {
    await downloadFile(url, filePath + filename)
  }

  return filename
}

const sContent = async ($content, $) => {

  let $links = $content.find("a")
  if ($links) {
    let links = $links.toArray()
    for (let j = 0; j < links.length; j++) {
      const link = links[j];
      let url = $(link).attr("href");
      if (!url.match("javascript") && url.match(isFile)) {
        let filename = await sDownload(url, 0)
        $(link).attr("href", urlPath + filename)
      }
      if (!url.match("javascript") && !url.match(isFile) && (url.match(doman) || !url.match('http'))) {
        $(link).attr("href", url.replace(doman, '').replace(/\.aspx/, ''))
      }

      // if (url.match("javascript")) {
      //   let data = await page.invokeMethod('evaluate', function () {
      //     //取得页面环境, 这个方法里的代码会在页面环境里运行
      //     console.log(document.title);
      //   });
      //   console.log(data)
      // }
    }
  }
  //read files links
  $links = $content.find("img")
  if ($links) {
    let links = $links.toArray()
    for (let j = 0; j < links.length; j++) {
      const link = links[j];
      let url = $(link).attr("src");
      let filename = await sDownload(url, 1)
      $(link).attr("src", urlPath + filename)
    }
  }
  return $content
}

// not finished
const sPage = async (url) => {
  console.log(url)
  let data = await pool.use(async (instance) => {
    const page = await instance.createPage()
    const status = await page.open(url, {
      operation: 'GET'
    })
    if (status !== 'success') throw new Error(status)
    const content = await page.property('content')
    const $ = cheerio.load(content)

    let $content = $(".container .row")

    $content = await sContent($content, $)

    return $content.html()
  })

  return data

}

let files = [];

//不做下载，只做文件记录
var downloadFile = async (url, filename) => {
  if (filename.match(isImage)) {
    await sfile({
      path: filename,
      url: url
    })
  }
  files.push({
    path: filename,
    url: url
  })
}

const sfile = async (file) => {
  if (!(await fs.pathExists(file.path))) {
    let dl = downloader.download(file.url, file.path);
    dl.on('error', function () {
      console.log(dl.error)
    });
    dl.start();
  }
}
