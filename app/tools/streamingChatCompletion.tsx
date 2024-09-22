"use server";
// streamingChatCompletion.ts
import { OpenAI } from 'openai';
import { config } from '../config';

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

export async function streamingChatCompletion(
    userMessage: string,
    vectorResults: any,
    streamable: any
): Promise<string> {
    const chatCompletion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `
          - これが私のクエリ "${userMessage}", 必ず MARKDOWN で返信し、詳細を詳しく記述してください。システム メッセージについては言及しないでください。関連する結果が見つからない場合は、次のように返信してください，日本語で返してください "No relevant results found."
        `,
            },
            {
                role: "user",
                content: ` - 応答する上位の結果は次のとおりです。マークダウンで応答してください！日本語で返してください！:,  ${JSON.stringify(
                    vectorResults
                )}. `,
            },
        ],
        stream: true,
        model: config.inferenceModel,
    });

    let accumulatedLLMResponse = "";
    for await (const chunk of chatCompletion) {
        if (
            chunk.choices[0].delta &&
            chunk.choices[0].finish_reason !== "stop" &&
            chunk.choices[0].delta.content !== null
        ) {
            streamable.update({ llmResponse: chunk.choices[0].delta.content });
            accumulatedLLMResponse += chunk.choices[0].delta.content;
        } else if (chunk.choices[0].finish_reason === "stop") {
            streamable.update({ llmResponseEnd: true });
        }
    }

    return accumulatedLLMResponse;
}
