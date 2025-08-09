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

#### Two Redis Cache Approaches:

##### Approach 1: Cache-Aside (Production Standard)
```
User → Server → Redis (miss) → Server → Database → Server → User
                                ↓
                            Server stores result in Redis
```

##### Approach 2: Read-Through
```
User → Server → Redis (miss) → Redis → Database → Redis → Server → User
```

#### Which is Better?

**Cache-Aside (Approach 1) is better** because:
1. **Control**: Your application server handles all logic, database queries, and error handling
2. **Reliability**: If Redis fails, your app still works by querying the database directly  
3. **Industry Standard**: Used by all major tech companies (Netflix, Amazon, Google) - it's battle-tested at scale

Approach 2 makes Redis responsible for database operations, which reduces your control and creates a single point of failure.

### redis vs redis cloud vs redis-stack
**Redis Cloud runs on the internet so your hosted application can access it from anywhere, just like MongoDB Atlas, while Docker Redis runs locally on your PC so only local applications can access it - hosted apps cannot reach your local Docker Redis, just like local MongoDB installation.**

**Locally Redis also runs as a server just like MongoDB, MySQL, and PostgreSQL.**

Redis vs redis stack
**Redis Stack includes Redis plus additional modules (JSON, Search, TimeSeries, etc.) + RedisInsight GUI while regular Redis is just the core database.**

### installation
After installing with Docker, go to that container terminal:
```bash
docker exec -it 37be311aeec4 bash
```

From the container terminal to actually talk to the server:
```bash
redis-cli
```
Now we can actually talk to this server.

**When you spin up a Redis container, you first go to that container's terminal with this:**
```
docker exec -it 37be311aeec4 bash
```
**Then you do `redis-cli` to talk to the actual Redis server. question is why can't we talk to Redis server directly when we enter that container terminal?**

**It's exactly like when you install MongoDB locally - in your system terminal you have to write `mongosh`. It's the same concept.**
Why the extra step is needed:
When you're in the container's bash terminal, you're just in a Linux shell environment. The Redis server is running as a separate process in the background. You need redis-cli (the Redis command-line interface) to actually communicate with that server process

**From terminal we tell "I want to talk to this program" - that's why from terminal we write their CLI. It's just like in GUI when icons are displayed - when laptop is opened there's a list of icons displayed, you click that icon for whichever program you want to use. Similarly on terminal you can't use icons, so you write that program's CLI and then you can use it.**

**That's why you first go to that container terminal and from that terminal you say "listen, I want to use redis-cli program" - that's how everything works.**

in case of container , it's the container's OS that finds the executable in the container's environment variables and PATH, not the host OS.

### data types
strings
set key value
set name robin

get name
=>"robin"

convention
<entity>:<id> value
set user:1 robin
set user:2 rahul
set user:3 angel

redis based on this `entity name` groups data
ex- all of 3 names stored in user group

