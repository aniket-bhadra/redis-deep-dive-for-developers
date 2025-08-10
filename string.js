const client = require("./client");

async function init() {
  await client.set("msg:5", "hey from nodejs");
  await client.expire("msg:5",10);
  const result = await client.get("msg:2");
  console.log(`output is------> ${result}`);
}
init();
