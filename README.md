## Memoization vs Caching

- **Caching**: Stores any frequently retrieved data to speed up access.  
- **Memoization**: A type of caching that stores function return values for specific inputs.
- **Redis (In-Memory DB)**: Stores data in RAM, making it super fast but temporary.  
- **MongoDB**: Stores data on a physical drive (SSD/HDD), making it slower but permanent.

### The problem it's solving:
Prevent requerying, recomputing and speed up response, and we save frequent DB reads which leads to reducing load on DB.

No need to recompute because we can directly store the computed result in Redis and we update that result so that next time we can directly show the result instead of fetching from DB then computing.

### where is data being stored?
Redis primarily stores data in RAM for speed but also saves snapshots to disk.The snapshots are Redis's recovery mechanism - they're not meant for direct human access, but for Redis to rebuild RAM state after crashes.this snapshots stays Forever (until manually deleted or disk runs out of space)
Redis doesn't auto-delete old snapshots, You control retention 
there is 2 types RDB (Redis Database Backup), AOF (Append-Only File)
RDB and AOF are used to permanently store Redis data on disk to survive server crashes and restarts.

RDB: Creates periodic snapshots based on time intervals + number of changes (binary files) - fast recovery but may lose recent data between snapshots.
AOF: Logs every write command immediately - maximum data safety but slower startup, and most production uses both together.

### why use Redis for caching instead of server Ram?
We use Redis for caching instead of server RAM because storing data separately makes the server stateless, making scaling easier.
**Redis is specifically designed and optimized for in-memory data operations with advanced data structures and provides built-in expiration, clustering, pub/sub, atomic operations, concurrent access, and persistence.**

**Using raw server RAM directly would require building all these features from scratch which is complex and not feasible.**
