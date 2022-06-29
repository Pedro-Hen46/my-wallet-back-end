import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import chalk from 'chalk';
import joi from 'joi';

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
})
//======================= INICIANDO LOGICA DOS ENDPOINTS =========================//

server.post('/register', async (req, res) => {
    
    const registerSchema = joi.object({
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required()
    });

    const validateDataUser = registerSchema.validate(req.body, { abortEarly: true });

    if(validateDataUser.error){
        const {error} = validateDataUser;
        const message_error = error.details.map((item) => item.message);

        return res.status(400).send(message_error);
    }

    const userEmailVerificationMongo = await db
    .collection("users")
    .findOne({ email: { $eq: req.body.email } });
    
    if (userEmailVerificationMongo !== null){
        return res.status(409).send("ERRO: E-mail já cadastrado!");
    }

    const userToMongo = { 
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    }

    await db.collection("users").insertOne(userToMongo);
    res.status(201).send('Usuário Cadastro com sucesso!');
})






//======================= ABRINDO SERVIDOR NA PORTA INFORMADA =========================//

server.listen(PORT_SERVER, () => {
    console.info(chalk.bold.red('Servidor aberto na porta.: ', PORT_SERVER));
})