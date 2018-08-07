const phantom = require('phantom');
const fs = require('fs-extra');
const cheerio = require('cheerio')
const file = '../json/category.json';
var doman = 'http://www.ween-semi.com/';
var url = 'http://www.ween-semi.com/productcategory.aspx?c=15107';

(async function () {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function (requestData) {
    console.info('Requesting', requestData.url);
  });

  const status = await page.open('http://www.ween-semi.com/productcategory.aspx?c=15107');
  const content = await page.property('content');
  const $ = cheerio.load(content)

  var categories = $(".tv-category>div>table tr td:last-child a");
  var values = $(".custom-bordered tr");
  var data = {
    categories: [],
    attrs: [],
    values: [],
    attr_values: []
  };

  categories.each((idx, item) => {
    data.categories.push(doman + item.attribs.href);
  })

  values.each((idx, val) => {
    if (idx) {
      data.values[idx] = [];
      $(val).find("td").each((i, td) => {
        var td_value = $(td).text()
        data.values[idx].push(td_value)
        td_value && data.attr_values[i].values.push(td_value)
      })
    } else {
      $(val).find(".filter-header").each((idx, attr) => {
        var name = $(attr).text();
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

  fs.outputJson(file, data)

  await instance.exit();
})();
