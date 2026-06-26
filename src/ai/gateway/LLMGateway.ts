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

export interface LLMChatOptions {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    /** Request JSON output from the model (OpenAI-compatible: response_format json_object). */
    jsonMode?: boolean;
}

export interface LLMGatewayInstance {
    readonly provider: string;
    readonly model: string;
    chat(opts: LLMChatOptions): Promise<LLMResponse>;
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
    response_format?: { type: 'json_object' };
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

function loadConfig(): ModelsConfig {
    const configPath = path.resolve(__dirname, '../config/models.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as ModelsConfig;
}

function resolveProvider(overrides?: {
    provider?: string;
    model?: string;
}): { provider: string; model: string; apiKey: string; baseUrl: string } {
    const provider = (overrides?.provider ?? process.env.LLM_PROVIDER ?? 'openrouter').toLowerCase();
    const apiKey = process.env.LLM_API_KEY ?? '';

    if (!apiKey) {
        throw new Error('[LLMGateway] LLM_API_KEY is not set. Add it to .env or Jenkins credentials.');
    }

    const config = loadConfig();
    const providerConfig = config[provider];

    if (!providerConfig) {
        throw new Error(`[LLMGateway] Unknown provider "${provider}". Valid: ${Object.keys(config).join(', ')}`);
    }

    const model = overrides?.model ?? process.env.LLM_MODEL ?? providerConfig.defaultModel;
    const baseUrl = providerConfig.baseUrl;

    return { provider, model, apiKey, baseUrl };
}

async function callOpenAICompatible(
    messages: LLMMessage[],
    resolved: { provider: string; model: string; apiKey: string; baseUrl: string },
    opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<LLMResponse> {
    const { provider, model, apiKey, baseUrl } = resolved;

    const payload: OpenAIChatPayload = {
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
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

async function callClaude(
    messages: LLMMessage[],
    resolved: { provider: string; model: string; apiKey: string; baseUrl: string },
    opts: { temperature?: number; maxTokens?: number }
): Promise<LLMResponse> {
    const { model, apiKey, baseUrl } = resolved;

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

export class LLMGateway {
    static async chat(
        messages: LLMMessage[],
        opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
    ): Promise<LLMResponse> {
        const resolved = resolveProvider();

        if (resolved.provider === 'claude') {
            return callClaude(messages, resolved, opts);
        }

        return callOpenAICompatible(messages, resolved, opts);
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

/**
 * Factory that returns a bound gateway instance with optional provider/model overrides.
 * Falls back to LLM_PROVIDER / LLM_MODEL env vars when overrides are omitted.
 *
 *   const gw = llmGateway({ provider: 'openai', model: 'gpt-4o' });
 *   const result = await gw.chat({ messages, temperature: 0, jsonMode: true });
 */
export function llmGateway(overrides?: { provider?: string; model?: string }): LLMGatewayInstance {
    const resolved = resolveProvider(overrides);

    return {
        provider: resolved.provider,
        model: resolved.model,
        chat: (opts: LLMChatOptions) => {
            const { messages, ...rest } = opts;
            if (resolved.provider === 'claude') {
                return callClaude(messages, resolved, rest);
            }
            return callOpenAICompatible(messages, resolved, rest);
        },
    };
}
