import { ref } from 'vue';

const conversationId = ref('');
const messages = ref([]);

async function createConversation() {
    const response = await fetch(
        'http://localhost:3000/api/conversations',
        {
            method: 'POST'
        }
    );

    const result = await response.json();

    conversationId.value =
        result.data.conversationId;
}

async function sendMessage(message) {
    const response = await fetch(
        `http://localhost:3000/api/conversations/${conversationId.value}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        }
    );

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error);
    }

    messages.value.push({
        role: 'user',
        content: message
    });

    messages.value.push({
        role: 'assistant',
        content: result.data.answer
    });
}