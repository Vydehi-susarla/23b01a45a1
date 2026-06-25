# Stage 1

* Core actions the platform should support:
  * Fetch student notifications with options to filter by read status or category.
  * Mark a single notification as read.
  * Mark all notifications as read.
  * Send new notification to all students (Admin feature).
  * Get unread count.

* REST Endpoints:
  * GET /api/v1/notifications: retrieves notifications. Query parameters include page, limit, isRead, and type.
  * PATCH /api/v1/notifications/:id/read: marks a notification as read.
  * POST /api/v1/notifications/read-all: marks all notifications as read.
  * POST /api/v1/notifications: creates a notification. Requires type, targetGroup, and message.

* Request/Response Headers:
  * Authorization: Bearer JWT_TOKEN
  * Content-Type: application/json

* Real-time notifications design:
  * We will use Socket.io for WebSockets.
  * Client initiates WebSocket connection on login and passes token.
  * When a new notification is created, the server checks if student is online and emits it directly.
  * Offline students will query missed items via GET API next time they load the app.

# Stage 2

* Database suggestion: PostgreSQL.
  * Natural fit for relational schemas (students, notifications, states).
  * Space efficient by storing message text once in database, mapped to students via junction table.
  * Supports robust compound indexes.

* DB Schema:
  * Table students: id (Primary Key), name, email, roll_number, created_at.
  * Table notifications: id (Primary Key), type (Placement/Result/Event), message, created_at.
  * Table student_notifications: student_id (FK), notification_id (FK), is_read, read_at. PK is (student_id, notification_id).

* Volume & Scaling problems:
  * Large database table sizes make index lookup slow.
  * DB connection pool gets full during bulk inserts.
* Solutions:
  * Partition student_notifications table by month.
  * Use partial indexes only where is_read is false to keep index size small.
  * Setup database read-replicas for fetch queries.
  * Setup archive jobs to move notifications older than 60 days to cold storage.

* Queries:
  * Fetch unread:
    ```sql
    SELECT n.id, n.type, n.message, n.created_at 
    FROM student_notifications sn 
    JOIN notifications n ON sn.notification_id = n.id 
    WHERE sn.student_id = 1042 AND sn.is_read = FALSE
    ORDER BY n.created_at DESC;
    ```
  * Mark as read:
    ```sql
    UPDATE student_notifications 
    SET is_read = TRUE, read_at = NOW() 
    WHERE student_id = 1042 AND notification_id = 'cb73095b-b42b-479a-983f-4857bbfcb393';
    ```

# Stage 3

* Query analysis:
  * The query is inaccurate because it misses column list after SELECT, uses invalid column name 'student ID' with space, and does not join with junction table.
  * The query is slow because it performs a full table scan of 5,000,000 records without proper indexes.

* Changes & Cost:
  * Fix syntax errors and create a composite index:
    ```sql
    CREATE INDEX idx_sn_student_unread ON student_notifications (student_id, is_read, notification_id);
    ```
  * Cost goes from scanning 5,000,000 rows (O(N) time) to quick index search (O(log N) time).

* Indexing every column:
  * Bad advice because it increases write latency, consumes massive disk/RAM space, and confuses database optimizer.

* Last 7 days placements query:
  ```sql
  SELECT DISTINCT s.id, s.name, s.email 
  FROM students s 
  JOIN student_notifications sn ON s.id = sn.student_id 
  JOIN notifications n ON sn.notification_id = n.id 
  WHERE n.type = 'Placement' AND n.created_at >= NOW() - INTERVAL '7 days';
  ```



# Stage 4

* Caching with Redis:
  * Pros: Sub-millisecond reads, decreases DB query count.
  * Cons: Cache invalidation overhead.
* Socket.IO Push:
  * Pros: Instant delivery, removes fetch polling queries.
  * Cons: Consumes memory and active server connections.
* Read Replicas:
  * Pros: Offloads read operations.
  * Cons: Stale data due to replication lag.
* HTTP Validation:
  * Pros: Low bandwidth consumption.
  * Cons: Still triggers endpoint requests.


# Stage 5

* Problems in proposed pseudocode:
  * Loops block the thread since email API calls are synchronous and slow.
  * No retry mechanism or error tolerance if loop fails midway.
  * Database insert calls are done inside the loop, overwhelming connection pool.
  * Lacks API rate limit control.

* Failure recovery:
  * Save the message first, then queue individual jobs in a message broker.
  * Decouple database save and email sending. Email is slow and external, while database is fast and local.

* Revised Pseudocode:
  * HR clicks send -> Insert text to notifications table, bulk insert student_notifications, queue background job.
  * Background worker -> Process student list in chunks, queue emails, emit socket events.


# Stage 6

* Priority rules:
  * Sort by weight first (Placement = 3, Result = 2, Event = 1).
  * Sort by timestamp next (newest first).

* Streaming top 10:
  * Use a Min-Heap of size 10 to keep top elements.
  * Process incoming stream items in O(log 10) time.
  * Compare new item priority with heap root. Swap if new is higher.

* Deliverables:
  * Heap class: notification-app-be/heap.js
  * Priority Inbox runner: notification-app-be/priority-inbox.js
  * Captured Screenshots: in Outputs folders.
