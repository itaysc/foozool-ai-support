import { SeedTrackModel, TokenModel } from "src/schemas";

export async function seedTokens(organizationId: string): Promise<void> {
    try {
      const tokensSeeded = await SeedTrackModel.findOne({ name: 'tokens', status: 'completed' }).lean();
      if (tokensSeeded) {
        return;
      }
      const result = await TokenModel.insertMany({
        organizationId,
        token: '40dkOBAIPue7FbDLQ53gtLmTuA0Dmdht0kX0Ywiik9EUKdD9a3uzv3SSgPgaGBxY',
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