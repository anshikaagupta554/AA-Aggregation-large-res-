Everything worked fine when the data was small.The problem started when the response became very large.This happened when there were a lot of UPI transactions and when the PDF document size increased.The response would suddenly break,get cut in between,or become invalid JSON.Sometimes the API failed with a 500 error.Because of this,the client could not read the response properly.

To understand the problem better,I intentionally increased the data size.I increased the number of transactions to tens of thousands.I also generated very large PDF files,up to 500MB.I encoded the PDF as base64 and sent it inside the JSON response.Once the total response crossed around 600–700MB.
the issue became very clear.The response always broke or got truncated.

After testing multiple times,I noticed that the failure always depended on the response size.Smaller responses worked every time.Larger responses failed almost always.Node.js and Express were trying to hold the entire response in memory. Axios was also buffering large responses.On the client side,the browser could not handle such a huge JSON response.

The main reason was that I was trying to send a very large PDF inside a JSON response. JSON is not meant to carry huge binary data. Base64 encoding makes the data even bigger. Sending everything together in one response put too much pressure on memory and caused the response to break.
The original design tried to do everything in one API call. It returned transactions, analytics, and the full PDF in one JSON response. This is not a good design for large files. Using res.json() for such big responses is unsafe and does not scale in real systems.

How I Fixed the Problem
I changed the design of the system. Instead of putting the PDF inside the JSON, I separated it. Now the aggregated API returns only metadata and a URL for the PDF.The actual PDF is served through a different API that streams the file in chunks.This way,the JSON response stays small and safe.
the client calls the aggregated API.This API returns transaction data,analytics and a document URL.When the client needs the PDF,it loads it separately using that URL.The PDF is streamed instead of being loaded fully into memory.This prevents truncation and memory issues.

I tested the new approach with very large data.I used more than 50,000 transactions and PDF files up to 500MB.The response was always complete.The JSON never broke and the PDF loaded correctly in the browser.The server stayed stable even under heavy load.
The client now makes two requests instead of one.The backend logic became slightly more complex because of streaming.
The issue happened because large binary data was being forced into a JSON response.The correct solution is to keep JSON lightweight and stream large files separately.After changing the design,the system became stable, scalable, and production-ready.


