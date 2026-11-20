import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { chat } from './llm.js';
import {
    analyzeTicket
} from './services/ticketService.js';
import { randomUUID } from 'node:crypto';

import {
    createConversation,
    hasConversation,
    getMessages,
    deleteConversation
} from './stores/conversationStore.js';

import {
    sendMessage
} from './services/conversationService.js';

import {
    createSlotSession,
    getSlotSession,
    deleteSlotSession
} from './stores/slotStore.js';

import {
    processSlotMessage
} from './services/slotService.js';
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 1. 创建工单信息收集会话
app.post('/api/slot-sessions', (req, res) => {
    const session = createSlotSession();

    res.json({
        success: true,
        data: {
            sessionId: session.id,
            slots: session.slots,
            status: session.status
        }
    });
});

// 2. 提交本轮回答
app.post('/api/slot-sessions/:id/messages', async (req, res) => {
    try {
        console.log(req.body)
        const result = await processSlotMessage(
            req.params.id,
            req.body?.message
        );

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Slot Filling 失败:', error.message);

        const status = error.status ?? 502;

        res.status(status).json({
            success: false,
            error: status === 502
                ? '智能信息提取暂时失败'
                : error.message
        });
    }
});

// 3. 获取已收集的信息
app.get('/api/slot-sessions/:id', (req, res) => {
    const session = getSlotSession(req.params.id);

    if (!session) {
        return res.status(404).json({
            success: false,
            error: '会话不存在'
        });
    }

    res.json({
        success: true,
        data: {
            sessionId: session.id,
            slots: session.slots,
            status: session.status,
            history: session.history
        }
    });
});

// 4. 删除会话
app.delete('/api/slot-sessions/:id', (req, res) => {
    const deleted = deleteSlotSession(req.params.id);

    res.status(deleted ? 200 : 404).json({
        success: deleted
    });
});



app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Enterprise AI Agent is running'
    });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, systemPrompt } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'message 不能为空'
            });
        }

        const result = await chat({
            message,
            systemPrompt
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('LLM 请求失败:', {
            message: error.message,
            status: error.status,
            type: error.constructor.name
        });

        return res.status(getHttpStatus(error)).json({
            success: false,
            error: '模型服务调用失败'
        });
    }
});
app.post('/api/conversations', (req, res) => {
    const conversationId = randomUUID();

    createConversation(conversationId);

    res.json({
        success: true,
        data: {
            conversationId
        }
    });
});
app.post(
    '/api/conversations/:id/messages',
    async (req, res) => {
        try {
            const { id } = req.params;
            const { message } = req.body;
            console.log(message)
            if (!hasConversation(id)) {
                return res.status(404).json({
                    success: false,
                    error: '会话不存在'
                });
            }

            const result = await sendMessage(
                id,
                message
            );

            return res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('对话处理失败:', error.message);

            return res.status(502).json({
                success: false,
                error: '对话处理失败'
            });
        }
    }
);
app.get(
    '/api/conversations/:id',
    (req, res) => {
        const { id } = req.params;

        if (!hasConversation(id)) {
            return res.status(404).json({
                success: false,
                error: '会话不存在'
            });
        }

        res.json({
            success: true,
            data: {
                conversationId: id,
                messages: getMessages(id)
            }
        });
    }
);
app.delete(
    '/api/conversations/:id',
    (req, res) => {
        const success = deleteConversation(req.params.id);

        res.json({
            success,
            message: success ? '删除成功' : '会话不存在'
        });
    }
);
app.post('/api/tickets/analyze', async (req, res) => {
    try {
        const { description } = req.body;

        if (
            typeof description !== 'string' ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                error: 'description 不能为空'
            });
        }

        const result = await analyzeTicket(description);

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('工单分析失败:', error.message);

        return res.status(502).json({
            success: false,
            error: '工单智能分析失败'
        });
    }
});

function getHttpStatus(error) {
    if (error.status === 400) return 400;
    if (error.status === 401) return 401;
    if (error.status === 429) return 429;
    if (error.status >= 500) return 502;

    return 500;
}
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
});
