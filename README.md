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

### redis hashes
```
hset bike:1 model pulse brand hun type electric price 200000
```

This is represented this way:
```
bike:1
{
  model: pulse
  brand: hun  
  type: electric
  price: 200000
}
```
Here bike:1 is the key.

So to get the value:
```bash
hget bike:1 model
```
To get multiple values:
```bash
hmget bike:1 model price type
```
Increment a particular field value:
```bash
hincrby bike:1 price 10000
```

**In Redis hash, most operations are O(1), but expiration-related commands are O(n).**

### sorted sets
Collection of unique strings, ordered by an associated score.
If two items have the same score, Redis sorts them alphabetically.
Normal sets are unsorted, but here it's completely sorted, much like priority queue.

```bash
zadd rank 1 robin
zadd rank 6 watson
```
Here rank is the key, 1,6 is the score and robin, watson is that unique string.

```bash
zrange rank 0 -1
```
Gives all the strings that rank key contains in sorted order.

```bash
zrevrange rank 0 -1
```
Gives all the strings that rank key contains in reverse sorted order.

```bash
zrank rank riya
```
Gives the position of this string, basically tells the rank/position of this string.

```bash
zrangebyscore rank -inf 10
```
Searching by score, here it returns all the strings whose score is between -infinity to 10.

```bash
zrem rank riya
```
Remove the string riya.

```bash
zadd rank 25 riya
```
If riya already exists then its score gets updated and returns 0, if it does not exist it gets created and returns 1.

```bash
zincrby rank 20 virat
```
The score of string virat is incremented by 20.

Sorted sets is like a mix of sets and hash. Sets is a collection of unique strings, sorted sets also collection of unique strings but unlike sets it is sorted. Every string is associated with a score value just like hash. And most sorted set operations are O(log(n)), where *n* is the number of members.

### redis streams
Redis streams is a data structure that acts like append-only log - no modification, only append at the end sequentially, that is why this time complexity is O(1). But this data structure allows certain operations which other append-only logs do not, like random access that too in O(1) complexity.

Redis generates a unique ID for each stream entry. You can use these IDs to retrieve their associated entries later or to read and process all subsequent entries in the stream. After each entry it returns that unique ID.

```
1692632086370-0
```

Here number before 0 → timestamp of when this entry is created  
0 → at this timestamp how many entries are created

Suppose at same timestamp 3 entries are created, so those 3 are represented this way:
```
1692632086370-0
1692632086370-1
1692632086370-2
```

This way it handles concurrent entries at the same time.

```bash
XADD messages:room1 * user john message "hello world"
```
**Here:**
- `messages:room1` = stream key (like a chat room)
- `*` = auto-generate ID 
- `user john message "hello world"` = data (user=john, message="hello world")
after the key name and ID, the next arguments are the field-value pairs

Read two stream entries starting at ID 1754981631505-0
 xrange msg:room1 1754981631505-0 + count 2

**xread count 100 block 300 streams msg:room1 $**

`$` means "read only NEW entries that come AFTER this command runs" - since no one added new messages to msg:room1 during those 300ms, it returns nothing.

`0` = read all existing entries

**xread count 100 block 300 streams msg:room1 0**

So it gives all the messages from beginning of the stream, but to get all messages from beginning there is no point to use block, so we can do:

**XREAD STREAMS msg:room1 0**

**XRANGE msg:room1 1754981631505 1754981764472**

Reading data from between timeframes.

xdel msg:room1 1754981764472-0
delete this stream

**XADD can take explicit IDs instead of auto-generated ID we do with `*`, but in that case keep in mind next ID always has to be greater than previous:**

```
xadd msg 1 name jon
xadd msg 2 name jane
```
Redis streams have O(1) insertion AND O(log N) random access by ID. Reading a range of entries is O(N) where N is the number of entries returned

XREAD STREAMS mystream 1754999320689-0
gives you messages after the ID you pass.

### Geospatial
This lets us add latitude longitude data, meaning suppose inside `hotels:near` key I'm listing 3 hotels:

```bash
GEOADD hotels:near -122.27652 37.805186 hotel1
GEOADD hotels:near -122.27652 37.805186 hotel2
GEOADD hotels:near -122.27652 37.805186 hotel3
```

Now I've a user latitude and longitude, I can search within this user latitude longitude within 7km distance what hotels are available:

```bash
GEOSEARCH hotels:near FROMLONLAT -122.2612767 37.7936847 BYRADIUS 7 km WITHDIST
```

This is user latitude longitude, now Redis automatically calculates and shows list of hotels.

Redis geospatial indexes let you store coordinates and search for them.
(longitude comes before latitude)

### pubsub
Redis Pub/Sub uses channels, not keys
Keys store actual data,Operations like SET,LPUSH work with keys. Data persists until explicitly deleted or expired.
Channels are just names- they don't store data, When you publish a message to a channel, all subscribers to that channel receive it immediately
Messages are ephemeral - if no one is subscribed, the message is lost.
this Very fast and lightweight but No persistence, no delivery guarantees
that is why streams + pubsubs is used
How it works:

Producer adds message to stream: XADD mystream * data "hello"
Producer publishes notification: PUBLISH mystream:notify "new message"
Consumers subscribed to mystream:notify get instant notification
Consumers then read from stream: XREAD STREAMS mystream $
Even if consumer was offline, messages are still in the stream
this ensures Guaranteed delivery (via Streams) for offline consumers,we can re-read old messages from any point in the stream.

we use streams here instead of other data types because streams have **Auto timestamps**, **Concurrent writes**: Multiple clients can push data at the same time - streams handle this efficiently without conflicts, **Tracks timestamps**: Natural chronological ordering of messages

in pubsub if we use channels to publish then the subscriber gets the msg automatically when new msg arrives but if we use streams then when new msg arrives we have to manually read the stream XREAD STREAMS mystream LAST_MESSAGE_ID , we just get notification that new msg arrived but to read we have to manually read after that.

## Hybrid approach works like this:
we can't subscribe to a stream directly like you do with channels.

**Step 1:** Create a separate Pub/Sub channel for notifications
```redis
SUBSCRIBE mystream_notifications
```

**Step 2:** When producer adds to stream, it does TWO things:
```redis
XADD mystream * data "hello"           # Add to stream
PUBLISH mystream_notifications "new"   # Notify via pub/sub
```

**Step 3:** Consumer gets pub/sub notification, then reads stream:
```redis
# Consumer receives pub/sub notification "new"
# Then manually reads from stream:
XREAD STREAMS mystream LAST_MESSAGE_ID
```

## Key point:
- **Stream** = stores the actual data
- **Pub/Sub channel** = sends notifications only
- They are separate things with similar names (like `mystream` and `mystream_notifications`)

You subscribe to the **channel** for notifications, then read from the **stream** for actual data.

Please note that when using redis-cli, in subscribed mode commands such as UNSUBSCRIBE 
wont work can only quit the mode with Ctrl-C.


This explains the **format of responses** you get when using Redis Pub/Sub.

When you subscribe to a channel, Redis sends you **arrays with 3 parts**:

## 1. `subscribe` response:
```
["subscribe", "news", 1]
```
- `"subscribe"` = you successfully subscribed
- `"news"` = channel name you subscribed to  
- `1` = total channels you're now subscribed to
 you get when you subscribe to a channel

## 2. `unsubscribe` response:
```
["unsubscribe", "news", 0]
```
- `"unsubscribe"` = you successfully unsubscribed
- `"news"` = channel you unsubscribed from
- `0` = total channels remaining (0 means you can run normal Redis commands again),
 you get when you unsubscribe to a channel

## 3. `message` response:
```
["message", "news", "Breaking story!"]
```
- `"message"` = actual message received
- `"news"` = which channel it came from
- `"Breaking story!"` = the actual message content
you get when a message comes to you from that channel

When you're subscribed to channels, you're in "Pub/Sub mode" and can only run Pub/Sub commands like SUBSCRIBE, UNSUBSCRIBE, PUBLISH.

You can't run normal Redis commands like GET, SET, LPUSH while subscribed.

**Only when the count reaches 0** (meaning you unsubscribed from ALL channels) do you exit Pub/Sub mode and can run normal Redis commands again.

So yes - the client exits Pub/Sub state only when the count drops to zero!

**Sharded Pub/Sub:**
Regular Pub/Sub broadcasts to ALL nodes in cluster (inefficient). Sharded Pub/Sub sends each channel to only ONE specific node based on hash (much faster).

## WebSocket Scaling Problem:

**Problem:** Multiple server instances can't share WebSocket connections.

**Example Chat App Issue:**
When there are userA and userB connected to 1 server (server1), then with the help of websockets chat app can function - userA sends msg to server1, whenever server1 gets msg it sends the msg to userB with help of websockets. But the problem occurs when we scale to multiple servers server1, server2, server3:

- User A connects to Server 1
- User B connects to Server 2  
- When User A sends message, only users on Server 1 see it
- User B (on Server 2) doesn't get the message!

## Redis Pub/Sub Solution:

**How it works:**
1. All servers subscribe to same Redis channel: `SUBSCRIBE chat_room_1`
2. When User A sends message → Server 1 publishes to Redis: `PUBLISH chat_room_1 "Hello"`
3. Redis broadcasts to ALL servers (Server 1, Server 2, etc.)
4. Each server sends message to their connected WebSocket clients
5. Now User B (on Server 2) also gets the message!

**Steps:**
```javascript
// Each server does this:
redis.subscribe('chat_room_1')
redis.on('message', (channel, message) => {
  // Send to all WebSocket clients on THIS server
  webSocketClients.forEach(client => client.send(message))
})

// When user sends message:
redis.publish('chat_room_1', userMessage)
```

**Result:** All users across all servers see messages in real-time!