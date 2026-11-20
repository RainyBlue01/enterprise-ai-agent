
import { z } from 'zod';

// 每个字段一开始都允许为空
export const slotSchema = z.object({
    category: z.enum([
        'NETWORK',
        'SYSTEM',
        'ACCOUNT',
        'HARDWARE',
        'SOFTWARE',
        'OTHER'
    ]).nullable(),

    device: z.string().max(100).nullable(),

    networkType: z.string().max(100).nullable(),

    impactScope: z.string().max(100).nullable(),

    errorMessage: z.string().max(300).nullable()
}).strict();

export function createEmptySlots() {
    return {
        category: null,
        device: null,
        networkType: null,
        impactScope: null,
        errorMessage: null
    };
}

// 今天只实现 NETWORK 工单
export const requiredSlots = [
    'category',
    'device',
    'networkType',
    'impactScope',
    'errorMessage'
];

export function getMissingSlots(slots) {
    return requiredSlots.filter(
        key => slots[key] === null ||
            slots[key] === ''
    );
}
