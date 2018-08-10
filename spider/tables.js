const createPhantomPool = require('phantom-pool')
const fs = require('fs-extra')
var Downloader = require('mt-files-downloader');
var downloader = new Downloader();
//const downloader = require('./downloader')
const cheerio = require('cheerio')
const url = 'http://www.ween-semi.com/productcategory.aspx?c=15107'
const filePath = '../../sites/default/files/page/'
const urlPath = '/ween/sites/default/files/page/'
const isFile = /\.(jpg|jpeg|gif|png|pdf|doc|docx|xlsx|xls)/
const isImage = /\.(jpg|jpeg|gif|png)/;
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
    ['--ignore-ssl-errors=true', '--disk-cache=true'],
    {
      // logLevel: 'debug',
    }
  ] // arguments passed to phantomjs-node directly, default is `[]`. For all opts, see https://github.com/amir20/phantomjs-node#phantom-object-api
})

let files = []

const sCategory = url => {
  console.log(url)
  return pool.use(async instance => {
    let category_obj = []
    const page = await instance.createPage()
    // await page.on('onResourceRequested', function (requestData) {
    //   console.info('Requesting', requestData.url)
    // })

    const status = await page.open(url)
    const content = await page.property('content')
    const $ = cheerio.load(content)
    var categories = $('.tv-category>div>table tr td:last-child a')

    categories.each((idx, item) => {
      category_obj.push({
        name: $(item)
          .text()
          .replace(/ \([0-9]*\)/, ''),
        href: doman + item.attribs.href
      })
    })

    await fs.outputJson('../json/category.json', category_obj)

    return category_obj
  })
}

const sTableDetails = (url, filename) =>
  pool.use(async instance => {
    console.log(url)
    let products = []
    const page = await instance.createPage()
    const status = await page.open(url, {
      operation: 'GET'
    })
    if (status !== 'success') throw new Error(status)
    const content = await page.property('content')
    const $ = cheerio.load(content)

    let table = $('table.dataTable')
    table = await sFiles(table, $)

    var values = $('.custom-bordered tr')
    var data = {
      attrs: [],
      values: [],
      attr_values: []
    }
    values.each((idx, val) => {
      if (idx) {
        idx--
        data.values[idx] = []
        $(val)
          .find('td')
          .each((i, td) => {
            if (i === 0) {
              products.push({
                name: $(td)
                  .find('a')
                  .text(),
                href: $(td)
                  .find('a')
                  .attr('href')
              })
            }

            if ($(td).find('.tooltipped').length) {
              var td_value = $(td)
                .find('.tooltipped')
                .attr('href')
            } else {
              var td_value = $(td).text()
            }
            data.values[idx].push(td_value)
            td_value && data.attr_values[i].values.push(td_value)
          })
      } else {
        $(val)
          .find('.filter-header')
          .each((idx, attr) => {
            var name = $(attr).text()
            data.attrs.push(name)
            data.attr_values[idx] = {
              name: name,
              values: []
            }
          })
      }
    })

    data.attr_values.map(el => {
      el.values = [...new Set(el.values)]
      return el
    })

    await fs.outputJson('../json/tables/' + filename + '.json', data)
    return products
  })

const sTables = async items => {
  let products = []
  for (let i = 0; i < items.length; i++) {
    const el = items[i]
    let pd_items = await sTableDetails(el.href, 'table-' + i)
    products = [...products, ...pd_items]
  }

  return products
}

const sDownload = async url => {
  !url.match(doman) && !url.match('http') && (url = doman + url)
  let filename = url
    .split('/')
    .pop()
    .split('?')[0]
  const is_exist = await fs.pathExists(filePath + filename)
  if (!is_exist) {
    await downloadFile(url, filePath + filename)
  }

  return filename
}



//过滤文件路径为本地路径
const sFiles = async ($content, $) => {
  let $links = $content.find('a')
  if ($links) {
    let links = $links.toArray()
    for (let j = 0; j < links.length; j++) {
      const link = links[j]
      let url = $(link).attr('href')
      if (!url.match('javascript') && url.match(isFile)) {
        let filename = await sDownload(url)
        $(link).attr('href', urlPath + filename)
      }

      // 爬取table 不用过滤页面链接，因为爬product的使用需要这些链接
      // if (!url.match('javascript') &&
      //   !url.match(isFile) &&
      //   (url.match(doman) || !url.match('http'))
      // ) {
      //   $(link).attr('href', url.replace(doman, '').replace(/\.aspx/, ''))
      // }
    }
  }
  //read files links
  $links = $content.find('img')
  if ($links) {
    let links = $links.toArray()
    for (let j = 0; j < links.length; j++) {
      const link = links[j]
      let url = $(link).attr('src')
      let filename = await sDownload(url)
      $(link).attr('src', urlPath + filename)
    }
  }
  return $content
}

// const downloadFile = async (uri, filename) => {
//   let stream = fsys.createWriteStream(filename);
//   await request(uri).pipe(stream);
// }


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

sCategory(url)
  .then(items => {
    return sTables(items)
  })
  .then(products => {
    return fs.outputJson('../json/products.json', products)
  })
  .then(() => {
    fs.outputJson('../json/files.json', files)
    pool.drain().then(() => pool.clear())
  })
