
This backend service calls the evaluation API to fetch notifications, prioritizes them based on weight and timestamp (Placement > Result > Event, then newest first), uses a min-heap to keep the top 10 items, and sends logs to the logger service.

To run:
```bash
npm install
npm start
```
