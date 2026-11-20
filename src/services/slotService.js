
import { chat } from '../llm.js';

import {
    slotSystemPrompt
} from '../prompts/slotPrompt.js';

import {
    slotSchema,
    getMissingSlots
} from '../schemas/slotSchema.js';

import {
    getSlotSession
} from '../stores/slotStore.js';

// 每个信息槽对应一个确定性追问
const questions = {
    category: '请问遇到的是网络、系统、账号、软件还是硬件问题？',
    device: '请问你使用的是什么设备？',
    networkType: '请问连接的是公司 Wi-Fi、有线网络还是 VPN？',
    impactScope: '请问只有你遇到问题，还是部门或全公司都受到影响？',
    errorMessage: '请问有具体错误提示吗？如果没有，请回答“没有错误提示”。'
};

// 合并新增信息
function mergeSlots(oldSlots, extracted) {
    const updated = { ...oldSlots };

    for (const [key, value] of Object.entries(extracted)) {
        if (value !== null && value !== '') {
            updated[key] = value;
        }
    }

    return updated;
}

// 调用 DeepSeek 提取本轮信息
async function extractSlots(currentSlots, message) {
    const prompt = `
当前已收集的工单状态：
${JSON.stringify(currentSlots)}

用户本轮回答：
${JSON.stringify(message)}

请只提取本轮新增或更正的字段。
必须返回包含全部五个字段的 JSON。
未提及的字段使用 null。
`;

    const result = await chat({
        messages: [
            {
                role: 'system',
                content: slotSystemPrompt
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.1,
        responseFormat: {
            type: 'json_object'
        }
    });

    if (!result.content.trim()) {
        throw new Error('DeepSeek 返回了空内容');
    }

    let data;

    try {
        data = JSON.parse(result.content);
    } catch {
        throw new Error('DeepSeek 返回了非法 JSON');
    }

    return {
        extracted: slotSchema.parse(data),
        usage: result.usage
    };
}

// 处理一次用户回答
export async function processSlotMessage(
    sessionId,
    message
) {
    const session = getSlotSession(sessionId);

    if (!session) {
        const error = new Error('会话不存在');
        error.status = 404;
        throw error;
    }

    if (session.busy) {
        const error = new Error('上一条消息仍在处理中');
        error.status = 409;
        throw error;
    }
    console.log(message)
    if (
        typeof message !== 'string' ||
        !message.trim() ||
        message.length > 2000
    ) {
        const error = new Error('消息必须为 1～2000 个字符');
        error.status = 400;
        throw error;
    }

    if (session.status !== 'COLLECTING') {
        const error = new Error('信息已收集完成，请先确认工单');
        error.status = 409;
        throw error;
    }

    session.busy = true;

    try {
        // 1. 让 DeepSeek 提取新增字段
        const { extracted, usage } = await extractSlots(
            session.slots,
            message.trim()
        );

        // 2. 校验通过后，合并到业务状态
        const updatedSlots = mergeSlots(
            session.slots,
            extracted
        );

        // 3. 计算缺失字段
        const missing = getMissingSlots(updatedSlots);

        // 4. 由后端决定下一步
        const isComplete = missing.length === 0;

        const answer = isComplete
            ? '信息已收集完成，请确认工单草稿。'
            : questions[missing[0]];

        // 5. 更新会话
        session.slots = updatedSlots;

        session.status = isComplete
            ? 'READY_FOR_CONFIRMATION'
            : 'COLLECTING';

        session.history.push(
            { role: 'user', content: message.trim() },
            { role: 'assistant', content: answer }
        );

        // 6. 返回结果
        return {
            sessionId,
            answer,
            status: session.status,
            slots: session.slots,
            missingSlots: missing,
            ticketDraft: isComplete
                ? { ...session.slots }
                : null,
            usage
        };

    } finally {
        session.busy = false;
    }
}
