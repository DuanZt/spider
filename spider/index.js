var Crawler = require("crawler");
const fs = require('fs-extra')
const file = '../json/category.json'
var doman = 'http://www.ween-semi.com/'
var url = 'http://www.ween-semi.com/productcategory.aspx?c=15107'
var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
      var categories = $(".tv-category a");
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

    }
    done();
  }
});

c.queue(url);
