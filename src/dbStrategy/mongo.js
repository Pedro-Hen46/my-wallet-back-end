import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_NAME = process.env.MONGO_DATABASE_NAME;
const MONGO_URL = process.env.MONGO_URL;

const mongoClient = new MongoClient(MONGO_URL);
let db = null;

mongoClient.connect().then(() => {
  db = mongoClient.db(DATABASE_NAME);
});

const objectId = ObjectId;

export { db, objectId };