import { userRegister, userLogin } from '../controllers/userDataController.js';
import { Router } from 'express'

const router = Router();    

router.post("/register", userRegister);

router.post("/login", userLogin);

export default router;