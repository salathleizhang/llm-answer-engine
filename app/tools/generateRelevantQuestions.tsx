
import { config } from '../config';
import { OpenAI } from 'openai';

let openai: OpenAI;
if (config.useOllamaInference) {
    openai = new OpenAI({
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'ollama'
    });
} else {
    openai = new OpenAI({
        baseURL: config.nonOllamaBaseURL,
        apiKey: config.inferenceAPIKey
    });
}

interface SearchResult {
    title: string;
    link: string;
    favicon: string;
}

export const relevantQuestions = async (sources: SearchResult[], userMessage: String): Promise<any> => {
    return await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `
            あなたは、JSON 形式で 3 つのフォローアップ質問の配列を生成する質問ジェネレーターです.
            JSON スキーマには次の内容を含める必要があります:
            {
              "original": "元の検索クエリまたはコンテキスト",
              "followUp": [
                "質問 1",
                "質問 2", 
                "質問 3"
              ]
            }
            `,
            },
            {
                role: "user",
                content: `類似検索の上位結果に基づいてフォローアップの質問を生成する: ${JSON.stringify(sources)}. 元の検索クエリは: "${userMessage}".`,
            },
        ],
        model: config.inferenceModel,
        response_format: { type: "json_object" },
    });
};
