const db = require('../db/mysql')

async function logDocumentResponse({
  requestId,
  payload,
  status,
  errorMessage = null
}) {
  try {
    const payloadStr = payload ? JSON.stringify(payload) : null
    const payloadSize = payloadStr
      ? Buffer.byteLength(payloadStr, 'utf8')
      : 0

    const sql = `
      INSERT INTO document_response
      (request_id, payload_size_bytes, payload, status, error_message)
      VALUES (?, ?, ?, ?, ?)
    `

    await db.execute(sql, [
      requestId,
      payloadSize,
      payloadStr,
      status,
      errorMessage
    ])
  } catch (err) {
    console.error('Document response log failed:', err.message)
  }
}

module.exports = { logDocumentResponse }
