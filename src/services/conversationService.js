
import { chat } from '../llm.js';

import {
    conversationSystemPrompt
} from '../prompts/conversationPrompt.js';

import {
    getMessages,
    saveMessages
} from '../stores/conversationStore.js';

// 最多保留最近 10 轮完整对话
const MAX_HISTORY_MESSAGES = 20;

export async function sendMessage(
    conversationId,
    userMessage
) {
    if (
        typeof userMessage !== 'string' ||
        !userMessage.trim()
    ) {
        throw new Error('消息不能为空');
    }

    if (userMessage.length > 2000) {
        throw new Error('消息长度不能超过 2000 字符');
    }

    // 1. 获取当前会话历史
    const history = getMessages(conversationId);

    // 2. 裁剪历史消息
    const recentHistory = history.slice(
        -MAX_HISTORY_MESSAGES
    );

    // 3. 组装本次请求的上下文
    const messages = [
        {
            role: 'system',
            content: conversationSystemPrompt
        },
        ...recentHistory,
        {
            role: 'user',
            content: userMessage.trim()
        }
    ];

    // 4. 调用 DeepSeek
    const result = await chat({
        messages,
        temperature: 0.3
    });

    const assistantMessage = result.content;

    if (!assistantMessage) {
        throw new Error('模型返回内容为空');
    }

    // 5. 只有成功获取回答后，才保存本轮对话
    const updatedHistory = [
        ...recentHistory,
        {
            role: 'user',
            content: userMessage.trim()
        },
        {
            role: 'assistant',
            content: assistantMessage
        }
    ];

    // 6. 保存最多 10 轮
    saveMessages(
        conversationId,
        updatedHistory.slice(-MAX_HISTORY_MESSAGES)
    );

    return {
        conversationId,
        answer: assistantMessage,
        metadata: {
            model: result.model,
            usage: result.usage,
            duration: result.duration,
            historyMessages: Math.min(
                updatedHistory.length,
                MAX_HISTORY_MESSAGES
            )
        }
    };
}
