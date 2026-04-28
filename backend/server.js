require("dotenv").config();
const app = require( './src/app');
const { createServer } = require("http");
const { initSocketServer } = require('./src/socket/scoket.Server');
const connectdb = require('./src/db/bd');

const httpServer = createServer(app);

initSocketServer(httpServer);
connectdb();






httpServer.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});