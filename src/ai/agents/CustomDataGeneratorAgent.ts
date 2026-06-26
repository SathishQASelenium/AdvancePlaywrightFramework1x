/**
 * CustomDataGeneratorAgent — generates structured test data via the LLM gateway.
 *
 * Pass a JSON Schema file (structurePath) and a natural-language instruction
 * (prompt). The agent asks the LLM for a data instance matching the schema,
 * optionally validates the response, writes it to a unique directory under
 * `src/testdata/generated/`, and returns the path plus parsed data.
 *
 *   import { generateTestData } from '@ai/agents/CustomDataGeneratorAgent';
 *
 *   const { filePath, data } = await generateTestData({
 *       structurePath: path.join(__dirname, '../../../testdata/structures/booking.structure.json'),
 *       prompt: 'Generate one realistic hotel booking for a guest from the UK.',
 *       name: 'booking',
 *   });
 *   // -> src/testdata/generated/booking-<id>/testdata.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { createLogger } from '@utils/logger';
import { validateSchema } from '@utils/schemaValidator';
import { llmGateway, type LLMMessage } from '../gateway/LLMGateway';
import { extractJson } from '../utils/jsonExtract';
import type { ProviderId } from '../types';

const log = createLogger('CustomDataGenerator');

const DEFAULT_OUTPUT_ROOT = path.join(__dirname, '..', '..', 'testdata', 'generated');

export interface GenerateTestDataOptions {
    /** Path to the structure / JSON Schema file the output must match. */
    structurePath: string;
    /** Natural-language instruction describing the data to create. */
    prompt: string;
    /** Output folder label. Defaults to the structure filename stem. */
    name?: string;
    /** Gateway provider override (reads LLM_PROVIDER env if omitted). */
    provider?: ProviderId;
    /** Gateway model override (reads LLM_MODEL env if omitted). */
    model?: string;
    /** Sampling temperature. Default 0 for repeatable data. */
    temperature?: number;
    /** Validate output against the structure when it is a JSON Schema. Default true. */
    validate?: boolean;
    /** Root directory for generated output. Default `src/testdata/generated`. */
    outputRoot?: string;
}

export interface GeneratedTestData<T = unknown> {
    /** Absolute path to the written `testdata.json`. */
    filePath: string;
    /** The unique output directory. */
    dir: string;
    /** Parsed generated data. */
    data: T;
    provider: ProviderId;
    model: string;
    /** Present when schema validation ran. */
    valid?: boolean;
    /** Human-readable Ajv errors when invalid. */
    validationErrors?: string;
}

function looksLikeJsonSchema(structure: unknown): boolean {
    if (typeof structure !== 'object' || structure === null) return false;
    const s = structure as Record<string, unknown>;
    return '$schema' in s || 'properties' in s || 'type' in s || 'required' in s;
}

function buildMessages(structure: unknown, prompt: string): LLMMessage[] {
    const system =
        'You are a test-data generator. You receive a JSON Schema and must output ' +
        'ONLY a JSON data INSTANCE that validates against it — never the schema ' +
        'itself. Do NOT echo schema keywords ($schema, title, type, properties, ' +
        'required, additionalProperties). The output object\'s keys must be exactly ' +
        'the schema\'s property names with realistic synthetic values, and no extra ' +
        'keys. No prose, no markdown, no code fences.';
    const user =
        'JSON SCHEMA the output must validate against:\n' +
        JSON.stringify(structure, null, 2) +
        '\n\nINSTRUCTION:\n' +
        prompt +
        '\n\nReturn ONLY the JSON data instance (the object whose keys are the ' +
        "schema's properties). Include only properties defined in the schema.";
    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

export async function generateTestData<T = unknown>(
    opts: GenerateTestDataOptions,
): Promise<GeneratedTestData<T>> {
    const structureFile = path.resolve(opts.structurePath);
    const structure: unknown = JSON.parse(fs.readFileSync(structureFile, 'utf-8'));
    const name = opts.name ?? path.basename(structureFile).replace(/\.[^.]+$/, '');

    const gw = llmGateway({ provider: opts.provider, model: opts.model });
    log.info(`Generating "${name}" via ${gw.provider}/${gw.model}`);

    const result = await gw.chat({
        messages: buildMessages(structure, opts.prompt),
        temperature: opts.temperature ?? 0,
        jsonMode: true,
    });

    const data = extractJson<T>(result.content);

    let valid: boolean | undefined;
    let validationErrors: string | undefined;
    if (opts.validate !== false && looksLikeJsonSchema(structure)) {
        const check = validateSchema(structure as object, data);
        valid = check.valid;
        if (!check.valid) {
            validationErrors = check.errorText;
            log.warn(`Generated data failed schema validation:\n${check.errorText}`);
        } else {
            log.info('Generated data is schema-valid.');
        }
    }

    const uniqueId = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    const outputRoot = opts.outputRoot ?? DEFAULT_OUTPUT_ROOT;
    const dir = path.join(outputRoot, `${name}-${uniqueId}`);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, 'testdata.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    log.info(`Wrote test data -> ${filePath}`);

    return {
        filePath: path.resolve(filePath),
        dir,
        data,
        provider: result.provider as ProviderId,
        model: result.model,
        valid,
        validationErrors,
    };
}
