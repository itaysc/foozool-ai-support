import { callLLM } from '../llm';
import { faker } from '@faker-js/faker';
import { ICreateTicketPayload } from '../../types';
import { UserModel } from '../../schemas';
import { createZendeskTicket } from '../zendesk';
import sanitizeText from '../../utils/text-sanitize';


export const createTicket = async () => {
    try {
        const ticketTypes = ['question', 'incident', 'problem', 'task'];
        const priorities = ['low', 'normal', 'high', 'urgent'];
        
        const prompt = `
            Create a customer support ticket for an electronics store with a scenario that sounds real.
            
            return a valid json object with the following schema:
            {
                "subject": string (be specific and varied),
                "tags": string[] (include relevant tags like "electronics", "customer-service", "technical-support", etc.),
                "type": "${faker.helpers.arrayElement(ticketTypes)}",
                "comment": { "body": string (detailed description of the issue) }
            }
            
            Make the subject and comment body unique and realistic for this scenario.
            return only a valid json string that can be used with JSON.parse()
            Do not add any other text or comments to the response, use a single line response.
        `;
        
        // Find a user for the job - try multiple approaches
        let user = await UserModel.findOne({ email: 'itayschmidt@gmail.com' }).lean();
        
        // If no specific user found, try to find any user
        if (!user) {
            user = await UserModel.findOne().lean(); // Get any user
        }
        
        // If still no user found, we can't proceed
        if (!user || !user._id) {
            console.log('No users found in database. Please ensure the database is seeded with at least one user.');
            throw new Error('No valid user found for job execution. Please seed the database first.');
        }
        
        const response = await callLLM({
            userId: user._id.toString(),
            isChat: true,
            systemMsg: `You are a customer submitting a support ticket for an electronics store. Respond only with a valid JSON object (no text).`,
            prompt,
            maxTokens: 1000,
            temperature: 0.8,
            topP: 0.9,
            stop: ['\n\n'],
        });
        if (!response.data) {
            console.log(`Cannot create new ticket, invalid response produced from LLM`);
            throw new Error('No response from LLM');
        }
        const sanitizedText = sanitizeText(response.data);
        const json = JSON.parse(sanitizedText);
        const ticket: ICreateTicketPayload = {
            ticket: {
                ...json,
                comment: {
                    ...json.comment,
                    public: true,
                },
                via: {
                    channel: 'email',
                    public: true,
                    source: {
                        from: {
                            name: faker.person.fullName(),
                            address: faker.internet.email(),
                        },
                    },
                },
                priority: faker.helpers.arrayElement(priorities),
                status: 'open',
                external_id: faker.string.uuid(),
            }
        };
        await createZendeskTicket(ticket);
        return ticket;
    } catch (error) {
        console.error(`Cannot create new ticket, error: ${error}`);
        throw error;
    }
};  