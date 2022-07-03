import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chalk from "chalk";

import transactionsRouter from "./routes/transactionsRouter.js";
import userDataRouter from "./routes/userDataRouter.js";

dotenv.config();

const server = express();

server.use(cors());
server.use(express.json());

server.use(userDataRouter);
server.use(transactionsRouter);

server.listen(process.env.PORT, () => {
  console.info(chalk.bold.yellow("Servidor aberto na porta.: ", process.env.PORT));
});
