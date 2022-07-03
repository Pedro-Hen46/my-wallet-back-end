import { db } from '../dbStrategy/mongo.js';

async function validateUser(req, res, next) {
  const { authorization } = req.headers;

  const token = authorization?.replace('Bearer ', '');
  const session = await db.collection('sections').findOne({ token });

  if (!session) {
    return res.status(401).send("ERRO: Token inválido!");
  }

  res.locals.session = session;

  next();
}

export default validateUser;
