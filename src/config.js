import 'dotenv/config';

export const config = {
    port: Number(process.env.PORT || 3000),

    llm: {
        apiKey: process.env.LLM_API_KEY,
        baseURL: process.env.LLM_BASE_URL,
        model: process.env.LLM_MODEL || 'deepseek-flash',

        temperature: Number(
            process.env.LLM_TEMPERATURE ?? 0.3
        ),

        timeout: Number(
            process.env.LLM_TIMEOUT ?? 30000
        )
    }
};

if (!config.llm.apiKey) {
    throw new Error(
        '缺少 LLM_API_KEY，请检查 .env 文件'
    );
}