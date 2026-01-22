app.get('/internal/statement', (req, res) => {
  const count = Number(req.query.count) || 1000;

  const transactions = [];

  for (let i = 0; i < count; i++) {
    transactions.push({
      txnId: `TXN_${i}`,
      amount: Math.floor(Math.random() * 5000),
      mode: 'UPI',
      timestamp: Date.now() - i * 1000
    });
  }

  res.json({
    total: transactions.length,
    transactions
  });
});
