import { SeedTrackModel, TokenModel } from "src/schemas";
import config from 'src/config';

export async function seedTokens(organizationId: string): Promise<void> {
    try {
      const tokensSeeded = await SeedTrackModel.findOne({ name: 'tokens', status: 'completed' }).lean();
      if (tokensSeeded) {
        return;
      }
      const result = await TokenModel.insertMany({
        organizationId,
        token: config.ZENDESK_WEBHOOK_TOKEN,
        type: 'zendesk-webhook',
        description: 'Zendesk Webhook Token for demo organization',
      });
      console.log(`Inserted ${result.length} tokens`);
      await SeedTrackModel.create({ name: 'tokens', date: new Date(), status: 'completed' });
      return;
    } catch (error) {
      console.error('Error seeding tokens:', error);
      return;
    }
  }