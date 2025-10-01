import { Router } from 'express';
import { createTicket } from '../../../services/faker/create-ticket';
import generateQdrantTickets from '../../../services/faker/generateQdrantTickets';
import { authenticateJWT } from '../../../middleware/authenticate';
import { hasPermission } from '../../../middleware/permissions';

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

/**
 * POST /api/v1/faker/generate-qdrant-tickets
 * Generate realistic support tickets for a customer based on their activities
 * and insert them into Qdrant collection.
 */
router.post('/generate-qdrant-tickets', authenticateJWT, hasPermission('model:train'), async (req, res) => {
  try {
    const { organizationId, customerId, numTickets = 10 } = req.body;

    // Validate required parameters
    if (!organizationId || !customerId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId and customerId are required'
      });
    }

    if (numTickets < 1 || numTickets > 100) {
      return res.status(400).json({
        success: false,
        error: 'numTickets must be between 1 and 100'
      });
    }

    console.log(`🎫 Generating ${numTickets} tickets for customer ${customerId} in organization ${organizationId}`);

    const result = await generateQdrantTickets({
      organizationId,
      customerId,
      numTickets
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully generated ${result.ticketsCreated} tickets`,
        data: {
          ticketsCreated: result.ticketsCreated,
          organizationId,
          customerId,
          numTickets
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate tickets',
        details: result.errors
      });
    }

  } catch (error: any) {
    console.error('Error generating Qdrant tickets:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;