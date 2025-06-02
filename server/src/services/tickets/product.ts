import { IProduct } from '@common/types';
import { faker } from '@faker-js/faker';
import { ProductModel } from 'src/schemas/product.schema';
import { callLLM } from '../together.ai';
import { buildProductPromptFromTicket } from './prompts';
import sanitizeJSON from 'src/utils/sanitizeJson';

/**
 * Generate a mock product for demonstration purposes
 */
export function generateMockProduct(): IProduct {
  return {
    productName: '',
    serialNumber: faker.string.uuid(),
    purchaseDate: faker.date.past().toISOString(),
    price: faker.number.int({ min: 100, max: 1000 }),
    currency: 'USD',
    refundPolicy: {
      unit: 'days',
      value: 33,
    },
    warrantyPeriod: {
      unit: 'years',
      value: 2.5,
    },
    storeLocation: faker.location.city(),
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email(),
    metadata: {
      color: faker.color.human(),
    },
  };
}

/**
 * Extract product information from ticket using LLM (currently commented out in original)
 */
export async function extractProductFromTicket(userId: string, ticket: any): Promise<IProduct | null> {
  // This functionality is currently commented out in the original code
  // Uncomment and use when needed:
  
  // const productLLMResponse = await callLLM({
  //   userId,
  //   prompt: buildProductPromptFromTicket(ticket),
  //   model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  //   maxTokens: 1000,
  //   temperature: 0,
  // });
  
  // if (productLLMResponse.data) {
  //   const jsonText = sanitizeJSON(productLLMResponse.data);
  //   try {
  //     const product = JSON.parse(jsonText);
  //     await ProductModel.create(product);
  //     return product;
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }
  
  return null;
} 