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
        const user = await UserModel.findOne({ email: 'itayschmid@gmail.com' });
        const response = await callLLM({
            userId: user?._id.toString() || '',
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