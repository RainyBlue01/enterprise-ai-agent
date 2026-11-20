import OpenAI from 'openai';
import { config } from './config.js';
const client = new OpenAI({
    apiKey: config.llm.apiKey,
    baseURL: config.llm.baseURL,
    timeout: config.llm.timeout,
    maxRetries: 2
});

export async function chat({
    message,
    messages,
    systemPrompt = '你是一名专业企业 AI 助手。',
    temperature = config.llm.temperature,
    responseFormat
}) {

    // 兼容 Day 1 的单轮调用
    const finalMessages = messages ?? [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: message
        }
    ];
    if (!Array.isArray(finalMessages) || !finalMessages.length) {
        throw new Error('messages 必须是非空数组');
    }

    if (
        typeof temperature !== 'number' ||
        temperature < 0 ||
        temperature > 2
    ) {
        throw new Error('temperature 必须在 0 到 2 之间');
    }

    const startTime = Date.now();

    const requestParams = {
        model: config.llm.model,
        temperature,
        messages: finalMessages
    };
    // 可选：开启 JSON 输出模式
    if (responseFormat) {
        requestParams.response_format = responseFormat;
    }

    const response = await client.chat.completions.create(
        requestParams
    );

    return {
        content: response.choices[0]?.message?.content ?? '',
        usage: response.usage ?? null,
        model: response.model,
        duration: Date.now() - startTime
    };
}