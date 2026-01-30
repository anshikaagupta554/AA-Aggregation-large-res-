const db = require('./backend/db/mysql');

async function testLogging() {
  try {
    const result = await db.execute(
      `INSERT INTO request_logs 
       (request_id, email, phone, endpoint, status, response_time_ms, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['TEST_REQ_1', 'test@example.com', '9999999999', '/test', 'SUCCESS', 123, null]
    );
    console.log('Log inserted successfully:', result);
  } catch (err) {
    console.error('Failed to insert log:', err.message);
  }
}

testLogging();
