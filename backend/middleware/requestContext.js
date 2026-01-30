// middleware/requestContext.js
module.exports = (req, res, next) => {
  req.context = {
    requestId: require('uuid').v4(),
    clientIp:
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress,
    apiUrl: req.originalUrl,
    httpMethod: req.method,
    email: 'dummy.user@aa.com',
    phone: '9999999999'
  }

  console.log('Request Context:', req.context) // 👈 ADD THIS

  next()
}

