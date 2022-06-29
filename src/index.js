import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import chalk from "chalk";
import joi from "joi";

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

  await db.collection("users").insertOne({...user, password: passwordEncrypted});
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
  
    const userData = await db.collection('users').findOne({ email: user.email}); // ENCONTRANDO PELO EMAIL

    if(userData && bcrypt.compareSync(user.password, userData.password)){ //--- COMPARANDO AS SENHAS
        const token = uuid();

        await db.collection('sections').insertOne({
            token,
            userId: user._id
        });
        return res.status(201).send({token});
    } else return res.status(401).send('Email ou senho incorretos, tente novamente!');

    const passwordEncrypted = bcrypt.hashSync(user.password, 10);
  
    const userEmailVerificationMongo = await db
      .collection("users")
      .findOne({ email: { $eq: req.body.email } });
  
    if (userEmailVerificationMongo !== null) {
      return res.status(409).send("ERRO: E-mail já cadastrado!");
    }
  
    await db.collection("users").insertOne({...user, password: passwordEncrypted});
    res.status(201).send("Usuário Cadastro com sucesso!");
  });
  


//======================= ABRINDO SERVIDOR NA PORTA INFORMADA =========================//

server.listen(PORT_SERVER, () => {
  console.info(chalk.bold.red("Servidor aberto na porta.: ", PORT_SERVER));
});
