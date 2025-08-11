const client = require("./client");

async function hash() {
  await client.hset("student:1", {
    name: "robin",
    age: 26,
    dev: "backend",
  });
  const res = await client.hget("student:1", "dev");
  console.log(res);
  await client.quit()
}
hash();
