import { callLLM } from '../together.ai';
import { faker } from '@faker-js/faker';
import { ITicket } from '../../types/ticket';
import { UserModel } from '../../schemas';
import { createZendeskTicket } from '../zendesk';


export const createTicket = async () => {
    try {
        const prompt = `
            Respond only with a valid JSON object (no text). Schema:
            {
                "subject": string,
                "tags": string[],
                "type": "question"|"incident"|"problem"|"task",
                "comment": { "body": string }
            }
            Context: A customer support ticket for an electronics store (any issue).
            `;
        
        // Find a user for the job - try multiple approaches
        let user = await UserModel.findOne({ email: 'itayschmidt@gmail.com' });
        
        // If no specific user found, try to find any user
        if (!user) {
            user = await UserModel.findOne(); // Get any user
        }
        
        // If still no user found, we can't proceed
        if (!user || !user._id) {
            console.log('No users found in database. Please ensure the database is seeded with at least one user.');
            throw new Error('No valid user found for job execution. Please seed the database first.');
        }
        
        const response = await callLLM({
            userId: user._id.toString(),
            prompt,
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
            maxTokens: 1000,
            temperature: 0.2,
            topP: 0.8,
            stop: ['\n\n'],
        });
        if (!response.data) {
            console.log(`Cannot create new ticket, invalid response produced from LLM`);
            throw new Error('No response from LLM');
        }
        const json = JSON.parse(response.data);
        const ticket: ITicket = {
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
            externalId: faker.string.uuid(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await createZendeskTicket(ticket);
        return ticket;
    } catch (error) {
        console.error(`Cannot create new ticket, error: ${error}`);
        throw error;
    }
};  