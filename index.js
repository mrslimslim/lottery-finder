const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
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
    fs.writeFileSync('data1.json', JSON.stringify(data));
  }
}

const getData = async (fetcher) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

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

if (isMainThread) {
  const numWorkers = 4; // 总共创建4个worker线程
  const dataPerWorker = 10; // 每个worker线程处理10条数据

  // 创建多个worker线程
  for (let i = 0; i < numWorkers; i++) {
    const start = i * dataPerWorker;
    const end = (i + 1) * dataPerWorker;
    const worker = new Worker(__filename, { workerData: { start, end } });

    // 监听worker线程的消息
    worker.on('message', (data) => console.log(data));

    // 向worker线程发送消息
    worker.postMessage('start');
  }
} else {
  const start = workerData.start;
  const end = workerData.end;

  const fetchData = async () => {
    const data = await getData(new PageFetcherImpl());
    return data.slice(start, end);
  };

  const saveDataToFile = async (data) => {
    const oldData = JSON.parse(fs.readFileSync('data1.json', 'utf8')) || [];
    const newData = data.filter(item => !oldData.some(oldItem => oldItem.date === item.date));
    if (newData.length > 0) {
      fs.writeFileSync('data1.json', JSON.stringify([...oldData, ...newData]));
      return `Worker ${start}-${end}: ${newData.length} new data saved`;
    } else {
      return `Worker ${start}-${end}: No new data saved`;
    }
  };

  parentPort.on('message', async (msg) => {
    if (msg === 'start') {
      const data = await fetchData();
      const result = await saveDataToFile(data);
      parentPort.postMessage(result);
    }
  });
}