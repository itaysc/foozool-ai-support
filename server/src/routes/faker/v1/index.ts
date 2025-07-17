import { Router } from 'express';
import { createTicket } from '../../../services/faker/create-ticket';
import { authenticateJWT } from '../../../middleware/authenticate';

const router = Router();

router.post('/zendesk/ticket', authenticateJWT, async (req, res) => {
    try {
        const ticket = await createTicket();
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

export default router;