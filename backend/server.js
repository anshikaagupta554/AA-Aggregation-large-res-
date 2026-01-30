const express = require('express')
const axios = require('axios')
const cors = require('cors')

const requestContext = require('./middleware/requestContext')
const { logRequest } = require('./log/requestlog')
const { logClientResponse } = require('./log/clientResponseLog')
// const { logDocumentResponse } = require('./log/documentResponseLog')
const { logDocumentResponse } = require('./log/DocumentResponse')

const app = express()

app.use(cors())
app.use(express.json())
app.use(requestContext)

/* ---------- INTERNAL ENDPOINTS ---------- */

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
  const sizeMb = Number(req.query.sizeMb) || 50
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename="statement.pdf"')

  const pdfHeader = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
72 72 Td
(AA Aggregated Statement PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
trailer
<< /Root 1 0 R >>
startxref
%%EOF
`)
  res.write(pdfHeader)

  const paddingChunk = Buffer.alloc(1024 * 1024, ' ')
  let sent = 0
  const interval = setInterval(() => {
    if (sent >= sizeMb) {
      clearInterval(interval)
      res.end()
      return
    }
    res.write(paddingChunk)
    sent++
  }, 5)
})
app.get('/aa/aggregated-response', async (req, res) => {
  const startTime = Date.now()
  const count = Number(req.query.count) || 1

  try {
    const analyticsRes = await axios({
      url: 'http://localhost:3000/internal/analytics',
      responseType: 'json'
    })

    res.setHeader('Content-Type', 'application/json')
    res.write(`{"fetchedAt":"${new Date().toISOString()}","statement":`)

const statementStream = await axios({
      url: 'http://localhost:3000/internal/statement',
      params: { count },
      responseType: 'stream'
    })

    // Pipe statement directly to response
    statementStream.data.pipe(res, { end: false })

    statementStream.data.on('end', () => {
      // After statement ends, add analytics and document
      const combinedTail = `,"analytics":${JSON.stringify(analyticsRes.data)},"document":{"downloadUrl": "/aa/document?sizeMb=50"
}}`
      res.write(combinedTail)
      res.end()

      // Logging
      logRequest({
        requestId: req.context.requestId,
        clientIp: req.context.clientIp ?? null,
        apiUrl: req.context.apiUrl ?? null,
        httpMethod: req.context.httpMethod ?? null,
        email: req.context.email ?? null,
        phone: req.context.phone ?? null,
        endpoint: '/aa/aggregated-response',
        status: 'SUCCESS',
        responseTimeMs: Date.now() - startTime
      })

      logClientResponse({
        requestId: req.context.requestId,
        payload: { statement: '[STREAMED]', analytics: analyticsRes.data, document: { downloadUrl: '/aa/document?sizeMb=50' }
},
        status: 'SUCCESS'
      })
    })

    statementStream.data.on('error', (err) => {
      res.status(500).json({ error: 'Statement fetch failed' })
      logRequest({
        requestId: req.context.requestId,
        clientIp: req.context.clientIp ?? null,
        apiUrl: req.context.apiUrl ?? null,
        httpMethod: req.context.httpMethod ?? null,
        email: req.context.email ?? null,
        phone: req.context.phone ?? null,
        endpoint: '/aa/aggregated-response',
        status: 'FAILED',
        errorMessage: err.message,
        responseTimeMs: Date.now() - startTime
      })
    })

  } catch (err) {
    res.status(500).json({ error: 'Aggregated response failed' })
    logRequest({
      requestId: req.context.requestId,
      clientIp: req.context.clientIp ?? null,
      apiUrl: req.context.apiUrl ?? null,
      httpMethod: req.context.httpMethod ?? null,
      email: req.context.email ?? null,
      phone: req.context.phone ?? null,
      endpoint: '/aa/aggregated-response',
      status: 'FAILED',
      errorMessage: err.message,
      responseTimeMs: Date.now() - startTime
    })
  }
})

app.get('/aa/document', async (req, res) => {
  const startTime = Date.now()
  const sizeMb = Number(req.query.sizeMb) || 50

  try {
    const pdfRes = await axios({
      url: 'http://localhost:3000/internal/document',
      params: { sizeMb },
      responseType: 'stream'
    })

    res.setHeader('Content-Type', 'application/pdf')
    pdfRes.data.pipe(res)

    pdfRes.data.on('end', () => {
      // Request log
      logRequest({
        requestId: req.context.requestId,
        clientIp: req.context.clientIp ?? null,
        apiUrl: req.context.apiUrl ?? null,
        httpMethod: req.context.httpMethod ?? null,
        email: req.context.email ?? null,
        phone: req.context.phone ?? null,
        endpoint: '/aa/document',
        status: 'SUCCESS',
        responseTimeMs: Date.now() - startTime
      })

      // ✅ Document response log
      logDocumentResponse({
        requestId: req.context.requestId,
        payload: {
          type: 'PDF',
          sizeMb,
          streamed: true
        },
        status: 'SUCCESS'
      })
    })

  } catch (err) {
    res.status(500).json({ error: 'Document fetch failed' })

    logRequest({
      requestId: req.context.requestId,
      clientIp: req.context.clientIp ?? null,
      apiUrl: req.context.apiUrl ?? null,
      httpMethod: req.context.httpMethod ?? null,
      email: req.context.email ?? null,
      phone: req.context.phone ?? null,
      endpoint: '/aa/document',
      status: 'FAILED',
      errorMessage: err.message,
      responseTimeMs: Date.now() - startTime
    })

    logDocumentResponse({
      requestId: req.context.requestId,
      payload: { sizeMb },
      status: 'FAILED',
      errorMessage: err.message
    })
  }
})

/* ---------- START SERVER ---------- */
app.listen(3000, () => console.log('Backend running on http://localhost:3000'))
