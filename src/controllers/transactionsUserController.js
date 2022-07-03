import { db, objectId } from "../dbStrategy/mongo.js";
import joi from "joi";
import dayjs from "dayjs";

export async function getTransactions(req, res) {
  const session = res.locals.session;

  const transactions = await db
    .collection("transactions")
    .find({ userId: new objectId(session.userId) })
    .toArray();

  res.send(transactions);
}

export async function postTransactions(req, res) {
  const transaction = req.body;
  const session = res.locals.session;

  const transactionSchema = joi.object({
    value: joi.number().required(),
    description: joi.string().required(),
    type: joi.string().valid("loss", "gain").required(),
  });

  const { error } = transactionSchema.validate(transaction);

  if (error) {
    return res.status(422).send("DataError: Erro ao obter informações! ⚠");
  }

  const dayTransaction = dayjs().format("DD.MM");
  if (!session) {
    return res
      .status(401)
      .send("Acesso Negado: Você não tem permissão aqui... ⚠");
  }

  await db.collection("transactions").insertOne({
    ...transaction,
    userId: session.userId,
    date: dayTransaction,
  });
  res.status(201).send("Finança adicionada com sucesso.");
}
