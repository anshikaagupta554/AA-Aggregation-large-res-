I started by creating a basic Node.js+Express service.

The goal was to simulate an Account Aggregator backend that internally calls multiple AA-APIs and exposes one aggregated API to clients in json format.

I implemented three internal APIs to simulate real AA behavior:the statement api which provided with the transactions,the document api which simulates a PDF document using Base64 encoding and an analytics api which gave derived insights.
I created a get statement which calls the internal statement and analytics api
i tested with increasing payload size with curl for 10000 it worked but for 50k it didnt,
so got to know the server fails while serialising large responses.
