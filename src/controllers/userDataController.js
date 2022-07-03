import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { db } from '../dbStrategy/mongo.js';
import joi from 'joi';

export async function userRegister(req, res) {
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
}

export async function userLogin(req, res) {
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
}
