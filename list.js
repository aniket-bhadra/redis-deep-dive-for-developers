const { Redis } = require("ioredis");

const client = new Redis();

async function list() {
//   await client.lpush("items", 25);
//   await client.lpush("items", 35);
  const result = await client.blpop("items",40)
  console.log(result);
  await client.quit();
}
list();
