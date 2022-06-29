import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import chalk from "chalk";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

//======================= VARIAVEIS DE AMBIENTE DO DOTENV =========================//
const PORT_SERVER = process.env.PORT || 5001;
const DATABASE_NAME = process.env.MONGO_DATABASE_NAME;
const MONGO_URL = process.env.MONGO_URL;

const mongoClient = new MongoClient(MONGO_URL);
let db = null;

mongoClient.connect().then(() => {
  db = mongoClient.db(DATABASE_NAME);
});
//======================= INICIANDO LOGICA DOS ENDPOINTS =========================//

server.post("/register", async (req, res) => {
  const user = req.body;

  const registerSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  const validateDataUser = registerSchema.validate(user, {
    abortEarly: true,
  });

  if (validateDataUser.error) {
    const { error } = validateDataUser;
    const message_error = error.details.map((item) => item.message);

    return res.status(422).send(message_error);
  }

  const passwordEncrypted = bcrypt.hashSync(user.password, 10);

  const userEmailVerificationMongo = await db
    .collection("users")
    .findOne({ email: { $eq: req.body.email } });

  if (userEmailVerificationMongo !== null) {
    return res.status(409).send("ERRO: E-mail já cadastrado!");
  }

  await db
    .collection("users")
    .insertOne({ ...user, password: passwordEncrypted });
  res.status(201).send("Usuário Cadastro com sucesso!");
});

server.post("/login", async (req, res) => {
  const user = req.body;

  const registerSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  const validateDataUser = registerSchema.validate(user, {
    abortEarly: true,
  });

  if (validateDataUser.error) {
    const { error } = validateDataUser;
    const message_error = error.details.map((item) => item.message);

    return res.status(422).send(message_error);
  }

  const userData = await db.collection("users").findOne({ email: user.email }); // ENCONTRANDO PELO EMAIL

  if (userData && bcrypt.compareSync(user.password, userData.password)) {
    //--- COMPARANDO AS SENHAS
    const token = uuid();

    await db.collection("sections").insertOne({
      token,
      userId: userData._id,
    });
    const username = userData.name;
    return res.status(201).send({ token, username });
  } else
    return res.status(401).send("Email ou senha incorretos, tente novamente!");
});

server.get("/transactions", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    const session = await db.collection('sections').findOne({ token });
    if(!session) return res.status(401).send("ERRO: Token inválido!");

    const transactions = await db.collection('transactions')
    .find({ userId: new ObjectId(session.userId) })
    .toArray();

    res.send(transactions);
});

server.post('/transactions', async (req, res) => {
  const transaction = req.body;
  const { authorization } = req.headers;
  const token = authorization?.replace('Bearer ', '');

  const transactionSchema = joi.object({
    value: joi.number().required(),
    description: joi.string().required(),
    type: joi.string().valid("loss", "gain").required(),
  });

  const { error } = transactionSchema.validate(transaction);

  if (error) {
    return res.status(422).send('DataError: Erro ao obter informações! ⚠');
  }

  const session = await db.collection('sections').findOne({ token });
  const dayTransaction = dayjs().format('DD.MM');
  if (!session) {
    return res.status(401).send('Acesso Negado: Você não tem permissão aqui... ⚠');
  }

  await db.collection('transactions').insertOne({ ...transaction, userId: session.userId, date: dayTransaction });
  res.status(201).send('Finança adicionada com sucesso.');
});




//======================= ABRINDO SERVIDOR NA PORTA INFORMADA =========================//

server.listen(PORT_SERVER, () => {
  console.info(chalk.bold.yellow("Servidor aberto na porta.: ", PORT_SERVER));
});
