import Server from "./server";
// require('dotenv').config();

async function start() {
  const server: Server = new Server();
  server.startServer((port: number) => {
    console.log(`server is listening on port ${port}`);
   });
  await server.connectDB()
  await server.seedDB();
  await server.initElasticSearch();
}

start();