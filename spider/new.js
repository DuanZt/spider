const phantom = require('phantom')
const createPhantomPool = require('phantom-pool')
const fs = require('fs-extra')
const cheerio = require('cheerio')
const doman = 'http://www.ween-semi.com/'
const url = 'http://www.ween-semi.com/productcategory.aspx?c=15107'
const pool = createPhantomPool()

const sCategory = async function (url) {
  console.log(url);
  let category_obj = [];
  const instance = await phantom.create()
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
  await instance.exit()

  return category_obj
}



const sTableDetails = (url, filename) => pool.use(async (instance) => {
  console.log(url);
  let products = [];
  const page = await instance.createPage()
  const status = await page.open(url, {
    operation: 'GET'
  })
  if (status !== 'success') throw new Error(status)
  const content = await page.property('content')
  const $ = cheerio.load(content)

  var values = $('.custom-bordered tr')
  var data = {
    attrs: [],
    values: [],
    attr_values: []
  }
  values.each((idx, val) => {
    if (idx) {
      idx--;
      data.values[idx] = []
      $(val)
        .find('td')
        .each((i, td) => {
          i === 0 && (products.push($(td).find("a").attr("href")))
          var td_value = $(td).text()
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

  return products;
})


const sTables = async (items) => {
  let products = [];
  for (let i = 0; i < items.length; i++) {
    const el = items[i];
    let pd_items = await sTableDetails(el.href, 'table-' + i)
    products = [...products, ...pd_items]
  }


  products.map(el => {
    el.values = [...new Set(el.values)]
    return el
  })

  return products;
}




sCategory(url).then((items) => {
  return sTables(items)
}).then((products) => {
  return fs.outputJson('../json/products.json', products)
}).then(() => {
  pool.drain().then(() => pool.clear())
})
