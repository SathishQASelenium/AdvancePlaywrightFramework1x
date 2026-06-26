/**
 * providers — resolves which LLM provider/model/key to use at runtime.
 *
 * Model info lives in `src/ai/config/models.json`. Provider/model are selected
 * via env vars (LLM_PROVIDER, LLM_MODEL); the API key comes from LLM_API_KEY.
 *
 * Resolution order (provider): override -> LLM_PROVIDER -> 'openrouter'.
 * Resolution order (model):    override -> LLM_MODEL    -> provider default.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ProviderId, ModelsRegistry, ResolvedProvider } from '../types';

export interface ProviderOverrides {
    provider?: ProviderId;
    model?: string;
}

let cachedRegistry: ModelsRegistry | undefined;

/** Load and cache `models.json`. */
export function loadRegistry(): ModelsRegistry {
    if (!cachedRegistry) {
        const file = path.join(__dirname, 'models.json');
        cachedRegistry = JSON.parse(fs.readFileSync(file, 'utf-8')) as ModelsRegistry;
    }
    return cachedRegistry;
}

/**
 * Resolve provider + model + key into a ready-to-use config. Throws a clear
 * error when the API key is missing or the provider is unknown.
 */
export function resolveProvider(overrides: ProviderOverrides = {}): ResolvedProvider {
    const provider = (
        overrides.provider ?? process.env.LLM_PROVIDER ?? 'openrouter'
    ).toLowerCase() as ProviderId;

    const registry = loadRegistry();
    const cfg = registry[provider];

    if (!cfg) {
        throw new Error(
            `LLMGateway: Unknown provider "${provider}". Valid: ${Object.keys(registry).join(', ')}`,
        );
    }

    const apiKey = process.env.LLM_API_KEY ?? '';
    if (!apiKey) {
        throw new Error('LLMGateway: LLM_API_KEY is not set. Add it to .env or Jenkins credentials.');
    }

    const model = overrides.model ?? process.env.LLM_MODEL ?? cfg.defaultModel;
    const extraHeaders: Record<string, string> =
        provider === 'openrouter'
            ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'https://thetestingacademy.com' }
            : {};

    return { provider, baseUrl: cfg.baseUrl, apiKey, model, extraHeaders };
}

/**
 * Non-throwing key check — used by specs to `test.skip()` when no key is set,
 * keeping CI green without credentials.
 */
export function hasApiKey(overrides: ProviderOverrides = {}): boolean {
    try {
        resolveProvider(overrides);
        return true;
    } catch {
        return false;
    }
}
