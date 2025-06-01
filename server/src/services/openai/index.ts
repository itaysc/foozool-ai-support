import { OpenAI } from 'openai';
import config from '../../config';
/**
 * Function to call OpenAI API with a given prompt.
 * @param {string} apiKey - Your OpenAI API key.
 * @param {string} prompt - The prompt for OpenAI to extract information.
 * @returns {Promise<string>} - The extracted data from OpenAI.
 */
export async function convertTextToJson(prompt: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
  });


  try {
    // Call OpenAI API using the 'createChatCompletion' method for GPT models like "gpt-3.5-turbo"
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    // Extracting the text from the response
    return completion.choices[0].message?.content?.trim() ?? '';
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    throw new Error('Failed to extract data using OpenAI API');
  }
}
