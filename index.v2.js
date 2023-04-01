/*
 * @Author: mrslimslim 2451319596@qq.com
 * @Date: 2023-03-26 18:17:48
 * @LastEditors: mrslimslim 2451319596@qq.com
 * @LastEditTime: 2023-03-26 18:27:11
 * @FilePath: \lottery\index.v2.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'https://datachart.500.com/ssq/history/history.shtml';

class PageFetcher {
  async fetch(page) {}
}

class PageFetcherImpl extends PageFetcher {
  async fetch(page) {
    const rows = await page.$$('#tdata tr');
    console.log('rows', rows);
    const data = [];
    for (let i = 0; i < rows.length; i++) {
      const cells = await rows[i].$$('td');
      const row = {
        id: await cells[0].evaluate(node => node.innerText.trim()),
        date: await cells[15].evaluate(node => node.innerText.trim()),
        red: await Promise.all(cells.slice(1, 7).map(cell => cell.evaluate(node => node.innerText.trim()))),
        blue: await cells[7].evaluate(node => node.innerText.trim()),
        sales: await cells[8].evaluate(node => node.innerText.trim()),
        pool: await cells[9].evaluate(node => node.innerText.trim())
      };
      data.push(row);
    }
    return data;
  }
}

class FileSaver {
  async save(data) {}
}

class FileSaverImpl extends FileSaver {
  async save(data) {
    fs.writeFileSync('data.json', JSON.stringify(data));
  }
}

const getData = async (fetcher, page, start, end) => {
  await page.type('#start', start);
  await page.type('#end', end);
  await page.click('.tubiao_box_t img');

  const data = [];
  let newData = await fetcher.fetch(page);
  data.push(...newData);
  let count = newData.length;
  while (count === 1000) {
    newData = await fetcher.fetch(page);
    data.push(...newData);
    count = newData.length;
  }

  return data;
};

const saveData = async (data, saver) => {
  await saver.save(data);
};

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  const start = '21032';
  const end = '23032';
  const data = await getData(new PageFetcherImpl(), page, start, end);

  await browser.close();

  await saveData(data, new FileSaverImpl());
};

main();
