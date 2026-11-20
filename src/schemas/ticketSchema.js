import { z } from 'zod';

export const ticketSchema = z.object({
    category: z.enum([
        'SYSTEM',
        'NETWORK',
        'ACCOUNT',
        'HARDWARE',
        'SOFTWARE',
        'OTHER'
    ]),

    priority: z.enum([
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ]),

    summary: z.string().min(1).max(100),

    description: z.string().min(1).max(1000),

    suggestion: z.string().min(1).max(1000),

    need_more_info: z.boolean(),

    missing_information: z.array(z.string())
}).strict();