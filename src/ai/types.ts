/**
 * Shared types for the AI Agent Factory (`src/ai`).
 *
 * Provider-agnostic: OpenRouter, Groq, OpenAI and Claude are all described
 * by the same set of types.
 */

/** Providers wired into `models.json`. */
export type ProviderId = 'openrouter' | 'groq' | 'openai' | 'claude' | string;

/** A single chat message in the OpenAI chat-completions shape. */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/** One provider entry as stored in `models.json`. */
export interface ProviderConfig {
    baseUrl: string;
    defaultModel: string;
}

/** Top-level shape of `models.json`. */
export interface ModelsRegistry {
    [provider: string]: ProviderConfig;
}

/** A fully resolved provider — key already read and validated. */
export interface ResolvedProvider {
    provider: ProviderId;
    baseUrl: string;
    apiKey: string;
    model: string;
    /** Extra HTTP headers (e.g. OpenRouter attribution). */
    extraHeaders: Record<string, string>;
}

/** Arguments for a single `chat()` call. */
export interface ChatOptions {
    messages: ChatMessage[];
    /** Overrides the resolved model for this call. */
    model?: string;
    /** Sampling temperature. Default 0 for repeatable test data. */
    temperature?: number;
    /** Ask the provider for strict JSON (`response_format`). Default false. */
    jsonMode?: boolean;
    /** Per-request timeout in ms. Default 60_000. */
    timeoutMs?: number;
}

/** Result of a `chat()` call. */
export interface ChatResult {
    /** `choices[0].message.content`. */
    content: string;
    model: string;
    provider: ProviderId;
}

/** Public surface of a gateway instance. */
export interface LLMGateway {
    chat(opts: ChatOptions): Promise<ChatResult>;
    readonly provider: ProviderId;
    readonly model: string;
}
