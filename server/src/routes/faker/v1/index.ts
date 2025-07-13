import { Router } from 'express';
import { createTicket } from '../../../services/faker/create-ticket';
import { authenticateJWT } from '../../../middleware/authenticate';

const router = Router();

router.post('/zendesk/ticket', authenticateJWT, async (req, res) => {
    const ticket = await createTicket();
    res.status(201).json(ticket);
});

export default router;