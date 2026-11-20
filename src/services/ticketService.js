import { chat } from '../llm.js';

import {
    ticketSystemPrompt
} from '../prompts/ticketPrompt.js';

import {
    ticketSchema
} from '../schemas/ticketSchema.js';

export async function analyzeTicket(description) {
    const result = await chat({
        message: description,

        systemPrompt: ticketSystemPrompt,

        temperature: 0.1,

        responseFormat: {
            type: 'json_object'
        }
    });

    let parsed;

    try {
        parsed = JSON.parse(result.content);
    } catch {
        throw new Error('模型返回的内容不是合法 JSON');
    }

    const validation = ticketSchema.safeParse(parsed);

    if (!validation.success) {
        console.error(
            '工单数据校验失败:',
            validation.error.issues
        );

        throw new Error('模型返回的数据不符合工单 Schema');
    }

    return {
        ticket: validation.data,

        metadata: {
            model: result.model,
            usage: result.usage,
            duration: result.duration
        }
    };
}