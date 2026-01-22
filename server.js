const express = require('express')
const axios = require('axios')

const app = express()

app.get('/internal/statement', (req, res) => {
  const count = Number(req.query.count) || 50000

  res.setHeader('Content-Type', 'application/json')
  res.write(`{"total":${count},"transactions":[`)

  for (let i = 0; i < count; i++) {
    res.write(JSON.stringify({
      txnId: `TXN_${i}`,
      amount: Math.floor(Math.random() * 5000),
      mode: 'UPI',
      timestamp: Date.now() - i * 1000
    }))
    if (i < count - 1) res.write(',')
  }

  res.write(']}')
  res.end()
})

app.get('/internal/analytics', (req, res) => {
  res.json({
    monthlySpend: Array.from({ length: 12 }).map((_, i) => ({
      month: `2025-${i + 1}`,
      total: Math.floor(Math.random() * 50000)
    })),
    categoryBreakdown: {
      food: 100000,
      rent: 200000,
      shopping: 150000,
      travel: 80000,
      utilities: 60000
    },
    avgTxnAmount: 1200
  })
})

app.get('/internal/document', (req, res) => {
  const sizeMb = Number(req.query.sizeMb) || 500

  res.setHeader('Content-Type', 'application/octet-stream')

  const chunk = Buffer.alloc(1024 * 1024, 'a')
  let sent = 0

  const interval = setInterval(() => {
    if (sent >= sizeMb) {
      clearInterval(interval)
      res.end()
      return
    }
    res.write(chunk)
    sent++
  }, 5)
})

app.get('/aa/aggregated-response', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.write('{')

  res.write('"fetchedAt":"' + new Date().toISOString() + '",')

  res.write('"statement":')
  await axios({
    url: 'http://localhost:3000/internal/statement',
    responseType: 'stream'
  }).then(r => new Promise(resolve => {
    r.data.pipe(res, { end: false })
    r.data.on('end', resolve)
  }))

  res.write(',"analytics":')
  await axios({
    url: 'http://localhost:3000/internal/analytics',
    responseType: 'stream'
  }).then(r => new Promise(resolve => {
    r.data.pipe(res, { end: false })
    r.data.on('end', resolve)
  }))
  res.write(',"document":"')
  await axios({
    url: 'http://localhost:3000/internal/document',
    params: { sizeMb: 500 },
    responseType: 'stream'
  }).then(r => new Promise(resolve => {
    r.data.on('data', chunk => {
      res.write(chunk.toString('base64'))
    })
    r.data.on('end', resolve)
  }))
  res.write('"')

  res.write('}')
  res.end()
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
