import config from '../../config';
import Together from 'together-ai';
import { LLMUsageModel } from '../../schemas';
import { ILLMUsage } from '@common/types';
const together = new Together({ apiKey: config.TOGETHER_AI_API_KEY });

interface ITogetherAiResponse {
    data: string | null;
    model: string;
    isOutOfTokens: boolean;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }
}

interface ITogetherAiRequest {
    userId: string;
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string[];
}

export const resetUsageCycles = async () => {
    await LLMUsageModel.updateMany({}, { $set: {
        currentCycle: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            cachedTokens: 0,
        },
    } });
}

export const getRemainingTokens = async (userId: string): Promise<{ remainingTokens: number, record: ILLMUsage | null }> => {
    const usage: ILLMUsage | null = await LLMUsageModel.findOne({ user: userId });
    if (!usage) {
        return { remainingTokens: 0, record: null };
    }
    const { tokensPerCycle, totalPromptTokens, totalCompletionTokens, totalTokens, totalCachedTokens } = usage;
    return { remainingTokens: tokensPerCycle - (totalPromptTokens + totalCompletionTokens), record: usage };
}

async function recordUsage(record: ILLMUsage, userId: string, usage: ITogetherAiResponse) {
    await LLMUsageModel.updateOne({ user: userId }, 
        {
            $set: {
                currentCycle: {
                    promptTokens: record.currentCycle.promptTokens + usage.usage.promptTokens,
                    completionTokens: record.currentCycle.completionTokens + usage.usage.completionTokens,
                    totalTokens: record.currentCycle.totalTokens + usage.usage.totalTokens,
                },
                totalPromptTokens: record.totalPromptTokens + usage.usage.promptTokens,
                totalCompletionTokens: record.totalCompletionTokens + usage.usage.completionTokens,
                totalTokens: record.totalTokens + usage.usage.totalTokens,
            },
        }
    );
}

async function getLLMCompletion({
    model = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    prompt,
    maxTokens,
    temperature,
    topP,
    stop,
}: ITogetherAiRequest): Promise<ITogetherAiResponse> {
    const response = await together.completions.create({
        model,
        prompt: prompt,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        stop,
    });
    return {
        data: response.choices[0]?.text?.trim() ?? '',
        usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
        },
        isOutOfTokens: false,
        model: response.model,
    }
}

async function getLLMChatCompletion({
    model = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    userMsg = '',
    systemMsg = '',
    maxTokens = 300,
    temperature = 0.2,
    topP = 0.8,
    stop = ['\n\n'],
}: ITogetherAiRequest & { userMsg: string, systemMsg: string }): Promise<ITogetherAiResponse> {
    const response = await together.chat.completions.create({
        model,
        messages: [{ role: 'user', content: userMsg }, { role: 'system', content: systemMsg }],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        stop,
    });
    return {
        data: response.choices[0]?.message?.content?.trim() ?? '',
        usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
        },
        isOutOfTokens: false,
        model: response.model,
    }
}

const getEmptyResponse = (isOutOfTokens: boolean): ITogetherAiResponse => {
    return {
        data: null,
        model: '',
        isOutOfTokens,
        usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
        },
    }
}

export async function callLLM({
    userId,
    prompt,
    model = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    maxTokens = 300,
    temperature = 0.2,
    topP = 0.8,
    stop = ['\n\n'],
    isChat = false,
    systemMsg = '',
}: ITogetherAiRequest & { userMsg?: string, systemMsg?: string, isChat?: boolean }) : Promise<ITogetherAiResponse> {
    try {
        const { remainingTokens, record: usageRecord } = await getRemainingTokens(userId);
        if (remainingTokens <= 0 || !usageRecord) {
            return getEmptyResponse(true);
        }
        let response: ITogetherAiResponse;
        if (isChat) {
            response = await getLLMChatCompletion({ userId, prompt, model, maxTokens, temperature, topP, stop, userMsg: prompt, systemMsg });
        } else {
            response = await getLLMCompletion({ userId, prompt, model, maxTokens, temperature, topP, stop });
        }
        recordUsage(usageRecord, userId, response); // this is async by purpose
        return response;
    } catch (error) {
        console.error('Error fetching response from Together AI:', error);
        return getEmptyResponse(false);
    }
}

