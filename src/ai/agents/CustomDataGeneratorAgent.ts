import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { LLMGateway } from '../gateway/LLMGateway';

const PROMPTS_DIR = path.resolve(__dirname, '../../testdata/prompts');
const OUTPUT_DIR = path.resolve(__dirname, '../../testdata/ai-generated');

const SYSTEM_PROMPT =
    'You are a test data generator. Always respond with raw valid JSON only. ' +
    'No markdown, no code blocks, no explanation. Just the JSON object.';

export class CustomDataGeneratorAgent {
    static async generate(promptFileName: string): Promise<string> {
        const promptPath = path.join(PROMPTS_DIR, promptFileName);

        if (!fs.existsSync(promptPath)) {
            throw new Error(`[CustomDataGeneratorAgent] Prompt file not found: ${promptPath}`);
        }

        const promptContent = fs.readFileSync(promptPath, 'utf-8');
        const rawResponse = await LLMGateway.complete(promptContent, SYSTEM_PROMPT);

        const cleaned = CustomDataGeneratorAgent.stripMarkdownFences(rawResponse);
        const parsed: unknown = JSON.parse(cleaned);

        const stem = path.basename(promptFileName, path.extname(promptFileName));
        const uid = crypto.randomUUID();
        const outputFileName = `${stem}_${Date.now()}_${uid}.json`;
        const outputPath = path.join(OUTPUT_DIR, outputFileName);

        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf-8');

        return outputPath;
    }

    private static stripMarkdownFences(text: string): string {
        return text
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/, '')
            .trim();
    }
}
