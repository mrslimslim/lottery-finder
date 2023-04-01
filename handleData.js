const fs = require('fs')


fs.readFile('./data.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  // parse JSON string to JSON object
  const result = JSON.parse(data)
  const simple_data = result.map(item=> {
    return {
        date: item.date,
        list: [...item.red, item.blue]
    }
  })
  // 输出到data_simple.json
    fs.writeFile('./data_simple.json', JSON.stringify(simple_data), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
})