/**
 * LLMGateway — one entry point to every LLM provider.
 *
 *   import { llmGateway } from '@ai/gateway/LLMGateway';
 *
 *   const gw = llmGateway();                 // provider/model from env + models.json
 *   const res = await gw.chat({
 *       messages: [{ role: 'user', content: 'Say hi as JSON {"hi":true}' }],
 *   });
 *   console.log(res.content);
 *
 * OpenRouter, Groq and OpenAI all expose the same OpenAI-compatible
 * `POST {baseUrl}/chat/completions` API. Claude uses a separate adapter.
 * Provider is selected by env vars (LLM_PROVIDER / LLM_MODEL / LLM_API_KEY).
 */

import { createLogger } from '@utils/logger';
import { resolveProvider } from '../config/providers';
import type { ProviderOverrides } from '../config/providers';
import type { ResolvedProvider } from '../types';

const log = createLogger('LLMGateway');

const DEFAULT_TIMEOUT_MS = 60_000;

// ─── Exported interfaces (backward-compat aliases) ───────────────────────────

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    provider: string;
    model: string;
    raw?: unknown;
}

export interface LLMChatOptions {
    messages: LLMMessage[];
    /** Per-call model override. */
    model?: string;
    temperature?: number;
    maxTokens?: number;
    /** Request JSON output (`response_format: json_object`). Defaults to true. */
    jsonMode?: boolean;
    /** Request timeout in ms. Defaults to 60 000. */
    timeoutMs?: number;
}

export interface LLMGatewayInstance {
    readonly provider: string;
    readonly model: string;
    chat(opts: LLMChatOptions): Promise<LLMResponse>;
}

// ─── Internal response shapes ────────────────────────────────────────────────

interface ChatCompletionResponse {
    choices?: Array<{ message?: { content?: string } }>;
}

interface ClaudeResponse {
    content: Array<{ type: string; text: string }>;
}

// ─── Provider adapters ───────────────────────────────────────────────────────

async function callOpenAICompatible(
    messages: LLMMessage[],
    resolved: ResolvedProvider,
    opts: Omit<LLMChatOptions, 'messages'>,
): Promise<LLMResponse> {
    const { provider, apiKey, baseUrl, extraHeaders } = resolved;
    const model = opts.model ?? resolved.model;
    const temperature = opts.temperature ?? 0;
    const jsonMode = opts.jsonMode !== false;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const body: Record<string, unknown> = {
        model,
        messages,
        temperature,
        max_tokens: opts.maxTokens ?? 1024,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
    };

    log.info(`-> ${provider}/${model} (jsonMode=${jsonMode})`);
    const startedAt = Date.now();

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (err) {
        log.error(`${provider} request failed: ${(err as Error).message}`);
        throw new Error(`LLMGateway: ${provider} request failed: ${(err as Error).message}`, { cause: err });
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        log.error(`${provider} HTTP ${res.status}: ${text.slice(0, 300)}`);
        throw new Error(`LLMGateway: ${provider} HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as ChatCompletionResponse;
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
        throw new Error(`LLMGateway: ${provider} returned no message content.`);
    }

    log.info(`<- ${provider}/${model} ${Date.now() - startedAt}ms, ${content.length} chars`);
    return { content, provider, model, raw: json };
}

async function callClaude(
    messages: LLMMessage[],
    resolved: ResolvedProvider,
    opts: Omit<LLMChatOptions, 'messages'>,
): Promise<LLMResponse> {
    const { apiKey, baseUrl } = resolved;
    const model = opts.model ?? resolved.model;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
        model,
        max_tokens: opts.maxTokens ?? 1024,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
    };

    log.info(`-> claude/${model}`);
    const startedAt = Date.now();

    let res: Response;
    try {
        res = await fetch(`${baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (err) {
        log.error(`claude request failed: ${(err as Error).message}`);
        throw new Error(`LLMGateway: claude request failed: ${(err as Error).message}`, { cause: err });
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        log.error(`claude HTTP ${res.status}: ${text.slice(0, 300)}`);
        throw new Error(`LLMGateway: claude HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as ClaudeResponse;
    const content = json.content?.find(b => b.type === 'text')?.text ?? '';

    log.info(`<- claude/${model} ${Date.now() - startedAt}ms, ${content.length} chars`);
    return { content, provider: 'claude', model, raw: json };
}

// ─── Static class (reporter / legacy compat) ─────────────────────────────────

export class LLMGateway {
    static async chat(
        messages: LLMMessage[],
        opts: Omit<LLMChatOptions, 'messages'> = {},
    ): Promise<LLMResponse> {
        const resolved = resolveProvider();
        if (resolved.provider === 'claude') return callClaude(messages, resolved, opts);
        return callOpenAICompatible(messages, resolved, opts);
    }

    static async complete(userPrompt: string, systemPrompt?: string): Promise<string> {
        const messages: LLMMessage[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: userPrompt });
        const result = await LLMGateway.chat(messages);
        return result.content;
    }
}

// ─── Factory (primary public API) ────────────────────────────────────────────

/**
 * Returns a gateway bound to a resolved provider/model.
 * Provider/model come from env vars; pass overrides to change per-call.
 *
 *   const gw = llmGateway({ provider: 'openai', model: 'gpt-4o' });
 *   const res = await gw.chat({ messages, jsonMode: true });
 */
export function llmGateway(overrides?: ProviderOverrides): LLMGatewayInstance {
    const resolved = resolveProvider(overrides);
    return {
        provider: resolved.provider,
        model: resolved.model,
        chat: (opts: LLMChatOptions) => {
            const { messages, ...rest } = opts;
            if (resolved.provider === 'claude') return callClaude(messages, resolved, rest);
            return callOpenAICompatible(messages, resolved, rest);
        },
    };
}
