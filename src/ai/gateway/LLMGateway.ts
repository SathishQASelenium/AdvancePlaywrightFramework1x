import * as path from 'path';
import * as fs from 'fs';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    provider: string;
    model: string;
}

interface ProviderConfig {
    defaultModel: string;
    baseUrl: string;
}

type ModelsConfig = Record<string, ProviderConfig>;

interface OpenAIChatPayload {
    model: string;
    messages: LLMMessage[];
    temperature?: number;
    max_tokens?: number;
}

interface OpenAIChatResponse {
    choices: Array<{ message: { content: string } }>;
}

interface ClaudePayload {
    model: string;
    max_tokens: number;
    system?: string;
    messages: Array<{ role: string; content: string }>;
}

interface ClaudeResponse {
    content: Array<{ type: string; text: string }>;
}

export class LLMGateway {
    private static loadConfig(): ModelsConfig {
        const configPath = path.resolve(__dirname, '../config/models.json');
        return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as ModelsConfig;
    }

    private static resolveProvider(): { provider: string; model: string; apiKey: string; baseUrl: string } {
        const provider = (process.env.LLM_PROVIDER ?? 'openrouter').toLowerCase();
        const apiKey = process.env.LLM_API_KEY ?? '';

        if (!apiKey) {
            throw new Error('[LLMGateway] LLM_API_KEY is not set. Add it to .env or Jenkins credentials.');
        }

        const config = LLMGateway.loadConfig();
        const providerConfig = config[provider];

        if (!providerConfig) {
            throw new Error(`[LLMGateway] Unknown provider "${provider}". Valid: ${Object.keys(config).join(', ')}`);
        }

        const model = process.env.LLM_MODEL ?? providerConfig.defaultModel;
        const baseUrl = providerConfig.baseUrl;

        return { provider, model, apiKey, baseUrl };
    }

    static async chat(
        messages: LLMMessage[],
        opts: { temperature?: number; maxTokens?: number } = {}
    ): Promise<LLMResponse> {
        const { provider, model, apiKey, baseUrl } = LLMGateway.resolveProvider();

        if (provider === 'claude') {
            return LLMGateway.callClaude(messages, model, apiKey, baseUrl, opts);
        }

        return LLMGateway.callOpenAICompatible(messages, model, apiKey, baseUrl, provider, opts);
    }

    private static async callOpenAICompatible(
        messages: LLMMessage[],
        model: string,
        apiKey: string,
        baseUrl: string,
        provider: string,
        opts: { temperature?: number; maxTokens?: number }
    ): Promise<LLMResponse> {
        const payload: OpenAIChatPayload = {
            model,
            messages,
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 1024,
        };

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://thetestingacademy.com' } : {}),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`[LLMGateway] ${provider} error ${response.status}: ${err}`);
        }

        const data = (await response.json()) as OpenAIChatResponse;
        const content = data.choices?.[0]?.message?.content ?? '';

        return { content, provider, model };
    }

    private static async callClaude(
        messages: LLMMessage[],
        model: string,
        apiKey: string,
        baseUrl: string,
        opts: { temperature?: number; maxTokens?: number }
    ): Promise<LLMResponse> {
        const systemMsg = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const payload: ClaudePayload = {
            model,
            max_tokens: opts.maxTokens ?? 1024,
            ...(systemMsg ? { system: systemMsg.content } : {}),
            messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        };

        const response = await fetch(`${baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`[LLMGateway] claude error ${response.status}: ${err}`);
        }

        const data = (await response.json()) as ClaudeResponse;
        const content = data.content?.find(b => b.type === 'text')?.text ?? '';

        return { content, provider: 'claude', model };
    }

    static async complete(userPrompt: string, systemPrompt?: string): Promise<string> {
        const messages: LLMMessage[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        messages.push({ role: 'user', content: userPrompt });

        const result = await LLMGateway.chat(messages);
        return result.content;
    }
}
