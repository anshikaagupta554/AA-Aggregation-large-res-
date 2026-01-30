async function loadData() {
  const res = await fetch('http://localhost:3000/aa/aggregated-response')
  const data = await res.json()

  document.getElementById('output').textContent =
    JSON.stringify({ fetchedAt: data.fetchedAt }, null, 2)

  document.getElementById('pdfFrame').src =
    'http://localhost:3000' + data.document.downloadUrl
}
