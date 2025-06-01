import { LLMPricesModel, SeedTrackModel } from '../schemas';

const data =   [
    {
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      name: 'Meta-Llama 3.1 8B Instruct Turbo',
      displayName: 'Meta-Llama 3.1 8B Instruct Turbo',
      description: '8B parameter Llama model fine-tuned for instruction-following tasks.',
      pricePerToken: 0.00000018, // $0.18 per 1M tokens
      isRecommended: true,
    },
    {
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      name: 'Meta-Llama 3.1 70B Instruct Turbo',
      displayName: 'Meta-Llama 3.1 70B Instruct Turbo',
      description: '70B parameter Llama model fine-tuned for instruction-following tasks.',
      pricePerToken: 0.00000088, // $0.88 per 1M tokens
    },
    {
      model: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      name: 'Meta-Llama 3.1 405B Instruct Turbo',
      displayName: 'Meta-Llama 3.1 405B Instruct Turbo',
      description: '405B parameter Llama model fine-tuned for instruction-following tasks.',
      pricePerToken: 0.00000500, // $5.00 per 1M tokens
    },
    {
      model: 'mistralai/Mixtral-8x7B-v0.1',
      name: 'Mixtral 8x7B v0.1',
      displayName: 'Mixtral 8x7B v0.1',
      description: 'Mixtral 8x7B model.',
      pricePerToken: 0.00000050, // Estimated price
    },
    {
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      name: 'Mistral 7B Instruct v0.3',
      displayName: 'Mistral 7B Instruct v0.3',
      description: 'Mistral 7B Instruct model.',
      pricePerToken: 0.00000060, // Estimated price
    },
    {
      model: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      name: 'Qwen 2.5 72B Instruct Turbo',
      displayName: 'Qwen 2.5 72B Instruct Turbo',
      description: 'Qwen 2.5 72B Instruct Turbo model.',
      pricePerToken: 0.00000250, // Estimated price
    },
    {
      model: 'Qwen/Qwen2-VL-72B-Instruct',
      name: 'Qwen 2 VL 72B Instruct',
      displayName: 'Qwen 2 VL 72B Instruct',
      description: 'Qwen 2 VL 72B Instruct model.',
      pricePerToken: 0.00000280, // Estimated price
    },
    {
      model: 'Qwen/Qwen2-72B-Instruct',
      name: 'Qwen 2 72B Instruct',
      displayName: 'Qwen 2 72B Instruct',
      description: 'Qwen 2 72B Instruct model.',
      pricePerToken: 0.00000300, // Estimated price
    },
    {
      model: 'Salesforce/Llama-Rank-V1',
      name: 'Salesforce Llama Rank V1',
      displayName: 'Salesforce Llama Rank V1',
      description: 'Salesforce Llama Rank V1 model.',
      pricePerToken: 0.00000100, // Estimated price
    },
    {
      model: 'togethercomputer/m2-bert-80M-2k-retrieval',
      name: 'M2 BERT 80M 2K Retrieval',
      displayName: 'M2 BERT 80M 2K Retrieval',
      description: 'M2 BERT 80M 2K Retrieval model.',
      pricePerToken: 0.0000010, // Estimated price
    },
    {
      model: 'togethercomputer/m2-bert-80M-8k-retrieval',
      name: 'M2 BERT 80M 8K Retrieval',
      displayName: 'M2 BERT 80M 8K Retrieval',
      description: 'M2 BERT 80M 8K Retrieval model.',
      pricePerToken: 0.0000020, // Estimated price
    },
  ];

  export async function seedLLMPricings(): Promise<string | null> {
    try {
      const llmPricingSeeded = await SeedTrackModel.findOne({ name: 'llmPricing', status: 'completed' });
      if (llmPricingSeeded) {
        return null;
      }
      await LLMPricesModel.insertMany(data);
      console.log(`Inserted ${data.length} LLM pricings`);
      await SeedTrackModel.create({ name: 'llmPricing', date: new Date(), status: 'completed' });
      const recommendedLLMId = await LLMPricesModel.findOne({ isRecommended: true });
      return recommendedLLMId?._id.toString() || null;
    } catch (error) {
      console.error('Error seeding LLM pricings:', error);
      return null;
    } 
  }