Worked on a backend service that integrates with an Account Aggregator (AA).
The service exposes a single API to downstream clients.
Internally, this backend calls three independent AA APIs and aggregates their responses into one JSON response.


Internal APIs Used:
Statement API: Returns transaction-level UPI data.
Analytics API: Returns derived insights like monthly spend.
Document API: Returns a PDF account statement.

All three APIs are treated as external dependencies by the aggregation service.

Observed Issue
When the aggregated response becomes large, the API response starts failing.The response gets truncated, becomes invalid JSON, and causes client-side parsing failures.This issue was observed intermittently but became consistent with large payload sizes.

Objective
My task was to reproduce the issue, identify the root cause, and implement a production-safe solution.I also needed to validate the solution under increasing payload sizes.

Failure Reproduction
I reproduced the issue by increasing the number of UPI transactions and the document size.
At high volumes, the aggregated response size crossed several hundred megabytes.
At this point, the response was consistently cut and returned invalid JSON.

Investigation and Analysis
Node.js memory usage increased significantly during response generation.Express tried to serialize the entire response in memory using res.json().Base64 encoding increased document size by around 33%, adding more pressure.
