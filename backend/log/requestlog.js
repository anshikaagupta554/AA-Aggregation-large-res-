const db = require('../db/mysql');

async function logRequest(data) {
  try {
    console.log('Logging to DB:', data)

    await db.execute(
      `INSERT INTO request_logs
      (request_id, client_ip, api_url, http_method, email, phone, endpoint, status, response_time_ms, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.requestId,
        data.clientIp,
        data.apiUrl,
        data.httpMethod,
        data.email,
        data.phone,
        data.endpoint,
        data.status,
        data.responseTimeMs,
        data.errorMessage || null
      ]
    )

    console.log('DB insert success')
  } catch (err) {
    console.error('DB insert failed:', err.message)
  }
}

module.exports = { logRequest };
