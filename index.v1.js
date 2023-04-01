/*
 * @Author: mrslimslim 2451319596@qq.com
 * @Date: 2023-03-26 12:59:26
 * @LastEditors: mrslimslim 2451319596@qq.com
 * @LastEditTime: 2023-03-26 18:53:36
 * @FilePath: \lottery\index.v1.js
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
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#tdata tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          id: cells[0].textContent.trim(),
          date: cells[15].textContent.trim(),
          red: cells.slice(1, 7).map(cell => cell.textContent.trim()),
          blue: cells[7].textContent.trim(),
          sales: cells[8].textContent.trim(),
          pool: cells[9].textContent.trim()
        };
      });
    });

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

const getData = async (fetcher) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });
  const page = await browser.newPage();

  await page.goto(url);
  await page.$eval('#start', input => input.value = '');
 
  await page.type('#start', '21083');
  await page.waitForTimeout(3000);
  await page.$eval('#end', input => input.value = '');
  await page.type('#end', '23032');
  await page.waitForTimeout(3000);
  await page.click('.tubiao_box_t img');

  // 睡眠1秒，等待数据加载完毕，兼容新版本，waitForTimeout已经被废弃，用新方法替代
  await page.waitForTimeout(1000);



  // 模拟鼠标滚动，加载更多数据
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
  await page.waitForTimeout(1000);

  // 获取需要爬取的数据
  const data = await fetcher.fetch(page);

  await browser.close();

  return data;
};

const saveData = async (data, saver) => {
  await saver.save(data);
};

const main = async () => {
  const data = await getData(new PageFetcherImpl());
  await saveData(data, new FileSaverImpl());
};

main();