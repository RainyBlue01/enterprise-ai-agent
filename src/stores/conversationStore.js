
const conversations = new Map();

// 创建会话
export function createConversation(id) {
    conversations.set(id, []);
}

// 判断会话是否存在
export function hasConversation(id) {
    return conversations.has(id);
}

// 获取历史消息
export function getMessages(id) {
    return conversations.get(id) ?? [];
}

// 保存消息
export function saveMessages(id, messages) {
    conversations.set(id, messages);
}

// 删除会话
export function deleteConversation(id) {
    return conversations.delete(id);
}
