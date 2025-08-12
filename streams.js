const client = require("./client");

async function init() {
  const res = await client.xadd(
    "msg:room1",
    "*",
    "user",
    "stokes",
    "msg",
    "hi"
  );
  console.log(res);
  const allMessages = await client.xread("STREAMS", "msg:room1", "0");
  console.log("All messages from beginning:", allMessages);

  console.log("Waiting for new messages...");
  const newMessages = await client.xread(
    "COUNT",
    100,
    "BLOCK",
    7000,
    "STREAMS",
    "msg:room1",
    "$"
  );
  console.log("New messages:", newMessages);
}
init();
