const { Redis } = require("ioredis");
//by default hits 6379 port
const client = new Redis();

module.exports = client;
