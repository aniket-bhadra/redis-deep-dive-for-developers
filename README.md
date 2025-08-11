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

We go to terminal and write `mongosh` or `redis-cli` - it actually executes the command line .exe program (command line interface) which actually can talk to Redis/MongoDB server.

This same when we press MongoDB Compass icon or RedisInsight icon - it also executes .exe program which is graphical interface which actually can talk to Redis/MongoDB server.

But whatever path we choose, we must remember these paths run the GUI or CLI app to talk to this server, but the server has to run before all of this app to work. We can run this CLI/GUI app but if server is not running they won't work, so server needs to run separately and those processes will not start the server - those processes actually start running the CLI/GUI app which can talk to that server, not the server itself. Server needs to run separately manually.

### redis authentication
By default Redis server authentication is off, that is why we can use it without putting any password. If authentication is enabled, then in terminal we must provide redis-cli with password, and while working with Node.js when we call new Redis() here we must provide the password. By default authentication is off, that is why no password is needed. 

To enable authentication either when running Redis server in Docker container provide this way:
```bash
docker run -d --name redis-server -p 6379:6379 redis redis-server --requirepass yourpassword
```

Or for already running container connect to redis-cli and then run:
```bash
CONFIG SET requirepass yourpassword
```

Then next time whenever you want to access:
```bash
redis-cli -a yourpassword
```

`-a` means authentication flag - lets you provide password directly. Or do this:
```bash
redis-cli -u redis://:password@localhost:6379
```

`-u` means URL which lets you put all the configuration directly as URL - password, port, everything as URL.

And for Node.js we provide this way:
```javascript
const client = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'mypassword'
});
```

### Data types
**Strings**

```
set key value
set name robin

get name
=> "robin"
```

**Convention:**
```
<entity>:<id> value
set user:1 robin
set user:2 rahul
set user:3 angel
```

Redis based on this `entity name` groups data  
Ex: all of 3 names stored in user group

```
set msg:1 hi nx
```
`nx` - if `msg:1` key does not exist only then store value "hi", if exists then skip

```
mget msg:1 user:1 user:2
```
`mget` used when we need to fetch multiple keys at once

`mset` for multiple set

**Increasing count:**
```
set count 1
incr count
incrby count 25
```

### Access from Node.js

```javascript
const { Redis } = require("ioredis"); 
const client = new Redis(); // by default hits 6379 port
module.exports = client;

const client = require("./client");

async function init() {
  await client.set("msg:5", "hey from nodejs");
  const result = await client.get("msg:3");
  console.log(`output is------> ${result}`);
}

init();
```

```javascript
await client.expire("msg:5", 10);
```
Make the key live for only 10 seconds, after that it gets deleted. It is important because when we store data as cache we want that cache to be invalidated because after some point that cache will be stale, so to achieve that we can set expire limit - after that data will be gone from Redis so when server checks in Redis it gets null, so then server queries DB. This way user always gets up-to-date data instead of stale data.

### redis connection
When we create a Redis connection with `new Redis()` and perform operations like lpush, get, set, that Redis connection remains open waiting for potential future commands. This open connection prevents the Node.js process from naturally exiting, so the terminal stays hanging. To fix this, after operations we do `await client.quit();` - this gracefully closes the Redis connection which allows the Node.js process to exit normally.

But if we do this, then the next command has to create a connection first, then it will execute, which takes a little more time than if we keep the connection open. So choose when to close based on requirements - if subsequent commands need to execute, leave it open; if not, then close it.

### Redis List
Redis list can be used as stack or queues

Redis lists are implemented via Linked Lists. This means that even if you have millions of elements inside a list, the operation of adding a new element in the head or in the tail of the list is performed in constant time. 
Redis Lists are implemented with linked lists because for a database system it is crucial to be able to add elements to a very long list in a very fast way. 

What's the downside? Accessing an element by index is very fast in lists implemented with an Array (constant time indexed access) and not so fast in lists implemented by linked lists.
When fast access to the middle of a large collection of elements is important, there is a different data structure that can be used, called sorted sets.

so List operations that access its head or tail are O(1),commands that manipulate elements(lset) within a list are usually O(n). 

```bash
lpush keyName value
```
An array is created with that keyname and from the left side of the array this value is pushed.

```bash
rpush keyName value
```
From right side of that array this value is pushed

```bash
rpop keyname
```
From right side of that array last value is deleted
```bash
lpop keyname
```
From left side of that array last value is deleted

So now if we:
- From left-insert, from right-remove → this list automatically becomes Queue
- From left-insert, left-remove → this list automatically becomes Stack

But when using this stack, we still can insert value from right or we can remove from right as well - there is no restriction, so the list conceptually becomes stack or queue but we cannot restrict it to make it proper queue and stack.

To expire the list, we can only expire the whole list but not the specific element inside that list.

```bash
llen key -> gives length
```
push multiple items in list
```bash 
lpush items1 a b c
```
a b c these 3 values pushed to items1 list

LMOVE moves an element from one list to another list - if source has [a,b,c] and destination has [x,y,z],takes 'c' from right of source and puts it on left of destination, making source=[a,b] and destination=[c,x,y,z]
to do this we will

LMOVE source destination RIGHT LEFT
lmove item1 item2 right left

item1's end's last element moves to item2's start index
because In Redis list, LEFT is the START (index 0) of the array(head) and RIGHT is the END (last index) (tail)

**LRANGE gets a range of elements from a Redis list by start and end positions.**

```
LRANGE keyname start end
```

**Example: If list has [a,b,c,d,e], then `LRANGE mylist 1 3` returns [b,c,d] (elements from index 1 to 3).**

lrange is used to read values from list, to read the whole list->
lrange items 0 -1

**in Redis list if you delete all elements, the key is automatically deleted as well.**

#### blocking commands
Blpop, brpop, blmove,....

blpop item1 20

So if there is an element, it's automatically deleted. But if there is no element, it waits for that element for 20 seconds. If an element comes within that 20 seconds, it gets deleted. If that element does not come within 20 seconds, it returns null. While only lpop item1 returns null if no element is found - it does not wait.

If there is no element inside the list, that list does not exist inside Redis. So what is the point to wait?

It does not exist in Redis - this is true. But if any application runs lpush thatListName value2, that value2 will be pushed. So meanwhile that blpop waiting will get it in its waiting time and delete it. And if that push happens after that blpop waiting time, then it won't delete and null returns. This is how everything works.

If you specify 0 as the timeout in BLPOP, it waits forever until an element is available.

### capped list
**Capped lists** are used to store only the latest N items by discarding older ones.we achieve this with `LTRIM`, The `LTRIM` command works like `LRANGE` but instead of displaying elements, it keeps only the specified range and removes everything else. This is useful for maintaining recent items like social updates or logs.

### delete key
del keyname
### search keys with pattern
keys item*  ->list all the keys starting name item
keys user:* -> list all they keys starting name :user (user:1,user:2..)

### redis sets
Redis set is an unordered collection of unique strings. We can use this to track IP addresses, store user roles.

```bash
sadd item1 hi
```
For add

```bash
srem item1 hi
```
Remove that element

```bash
sismember item1 hi
```
Return 0/1 based on whether that element exists in that set or not

```bash
sinter setname1 setname2
```
Return the common values of these sets

```bash
scard item1
```
Returns the length of this set

```bash
smembers item1
```
Returns all the values inside set

**Most set operations (add, remove, check membership) are O(1) - highly efficient regardless of set size. But SMEMBERS is O(n) so avoid using SMEMBERS on large sets since it's too slow.**
