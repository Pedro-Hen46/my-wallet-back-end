import { getTransactions, postTransactions } from '../controllers/transactionsUserController.js';
import validateUser from '../middlewars/validateUser.js';
import { Router } from 'express';

const router  = Router();

router.get("/transactions", validateUser, getTransactions);

router.post('/transactions', validateUser, postTransactions);

export default router;  