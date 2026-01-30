const express = require('express')
const axios = require('axios')

const app = express()

app.get('/internal/statement', (req, res) => {
  const count = Number(req.query.count) || 1000
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

app.get('/aa/document/:id', (req, res) => {
  const sizeMb = Number(req.query.sizeMb) || 10

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline')

  const header = Buffer.from(
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 120 Td (AA Aggregation PDF) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
trailer
<< /Root 1 0 R >>
%%EOF`
  )

  res.write(header)

  const padding = Buffer.alloc(1024 * 1024, ' ')
  let sent = 0
  const interval = setInterval(() => {
    if (sent >= sizeMb) {
      clearInterval(interval)
      res.end()
      return
    }
    res.write(padding)
    sent++
  }, 5)
})

app.get('/aa/aggregated-response', async (req, res) => {
  const txnCount = Number(req.query.txnCount) || 1000
  const docSizeMb = Number(req.query.docSizeMb) || 10

  const [statement, analytics] = await Promise.all([
    axios.get(`http://localhost:3000/internal/statement?count=${txnCount}`),
    axios.get(`http://localhost:3000/internal/analytics`)
  ])

  res.json({
    fetchedAt: new Date().toISOString(),
    statement: statement.data,
    analytics: analytics.data,
    document: {
      downloadUrl: `/aa/document/abc123?sizeMb=${docSizeMb}`,
      sizeMb: docSizeMb
    }
  })
})

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>AA Aggregation UI</title>
<style>
body{font-family:Arial;padding:20px}
input,button{padding:8px;margin:5px}
iframe{width:100%;height:600px;margin-top:20px}
pre{background:#f4f4f4;padding:10px}
</style>
</head>
<body>

<h2>AA Aggregation Simulator</h2>

<label>Transaction Count:</label>
<input id="txn" value="5000"><br>

<label>PDF Size (MB):</label>
<input id="pdf" value="50"><br>

<button onclick="load()">Generate</button>

<h3>JSON Response</h3>
<pre id="json"></pre>

<h3>PDF</h3>
<iframe id="pdfFrame"></iframe>

<script>
async function load(){
  const txn=document.getElementById('txn').value
  const pdf=document.getElementById('pdf').value

  const res=await fetch(
    \`/aa/aggregated-response?txnCount=\${txn}&docSizeMb=\${pdf}\`
  )
  const data=await res.json()

  document.getElementById('json').textContent=
    JSON.stringify(data,null,2)

  document.getElementById('pdfFrame').src=
    data.document.downloadUrl
}
</script>

</body>
</html>
`)
})

app.listen(3000, () => console.log('Server running on 3000'))
