const mysql = require('mysql2/promise')


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Girnar@123',
  database: 'aa_logs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

console.log('MySQL connection connected')


module.exports = pool
