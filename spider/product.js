const phantom = require('phantom')
const createPhantomPool = require('phantom-pool')
const fs = require('fs-extra')
const http = require('http');
const fsys = require('fs');
const filePath = "../../sites/default/files/page/"
const urlPath = "/ween/sites/default/files/page/"
const cheerio = require('cheerio')
const isFile = /\.(jpg|jpeg|gif|png|pdf|xlsx|xls|doc|docx)/;
const request = require('request');
const doman = 'http://www.ween-semi.com/'
const pool = createPhantomPool();


(async () => {
  const products = await fs.readJson('../json/products.json')

  const data = await sProduct(doman + products[0])

  await fs.outputJSON('../json/log.json', data)

  pool.drain().then(() => pool.clear())
})()


const sProduct = (url) => {
  console.log(url)
  return pool.use(async (instance) => {
    const page = await instance.createPage()
    const status = await page.open(url, {
      operation: 'GET'
    })
    if (status !== 'success') throw new Error(status)
    const content = await page.property('content')
    const $ = cheerio.load(content)

    let data = {
      title: $("#showall .overview .ween-blue-fg span").text(),
      description: $("#showall .overview #pipDesc h2").text(),
      sections: []
    }

    titles = $("#showall .custom-bold").toArray()
    for (let i = 0; i < titles.length; i++) {
      const el = titles[i];

      $title = $(el).find("span").text()
      $content = $(el).parent().next()
      $links = $content.find("a")
      if ($links) {
        let links = $links.toArray()
        for (let j = 0; j < links.length; j++) {
          const link = links[j];
          let url = $(link).attr("href");
          if (url.match(isFile)) {
            (!url.match(doman) && !url.match('http')) && (url = doman + url);
            let filename = url.split('/').pop().split('?')[0]
            await downloadFile(url, filePath + filename)
            $(link).attr("href", urlPath + filename)
          }
        }
      }
      $links = $content.find("img")
      if ($links) {
        let links = $links.toArray()
        for (let j = 0; j < links.length; j++) {
          const link = links[j];
          let url = $(link).attr("src");
          (!url.match(doman) && !url.match('http')) && (url = doman + url);
          let filename = url.split('/').pop().split('?')[0]
          await downloadFile(url, filePath + filename)
          $(link).attr("src", urlPath + filename)
        }
      }

      data.sections.push({
        title: $title,
        content: $content.html()
      })
    }

    return data

  })
}


// not finished
const sPage = async (url) => {
  console.log(url)
  pool.use(async (instance) => {
    const page = await instance.createPage()
    const status = await page.open(url, {
      operation: 'GET'
    })
    if (status !== 'success') throw new Error(status)
    const content = await page.property('content')
    const $ = cheerio.load(content)

    let data = {
      title: $("h5.WeEn-blue-fg").text(),
      content: ''
    }

    $content = $(".container .row")
    $links_s = []
    $content.find("a") && $content.find("a").each((idx, el) => {
      let href = $(el).attr("href")
      href.match(isFile) && $links_s.push(href)
    })
    $images = []
    $content.find("img") && $content.find("img").each((idx, el) => {
      let href = $(el).attr("src")
      href.match(isFile) && $links_s.push(href)
    })

    let $files = [...$links_s, ...$images]


  })

}

const downloadFile = async (uri, filename) => {
  var stream = fsys.createWriteStream(filename);
  await request(uri).pipe(stream);
}
