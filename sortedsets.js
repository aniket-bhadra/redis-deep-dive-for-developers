const client = require("./client");

async function init() {
  await client.zadd("student", 25, "rob");
  await client.zadd("student", 65, "ben");
  const res = await client.zrange("student", 0, -1);
  console.log(res);
}
init();