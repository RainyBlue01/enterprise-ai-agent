
import { randomUUID } from 'node:crypto';
import { createEmptySlots } from '../schemas/slotSchema.js';

const sessions = new Map();

export function createSlotSession() {
    const id = randomUUID();

    const session = {
        id,
        slots: createEmptySlots(),
        history: [],
        status: 'COLLECTING',
        busy: false,
        createdAt: new Date().toISOString()
    };

    sessions.set(id, session);
    return session;
}

export function getSlotSession(id) {
    return sessions.get(id) ?? null;
}

export function deleteSlotSession(id) {
    return sessions.delete(id);
}
