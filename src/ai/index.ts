/**
 * AI Agent Factory — public barrel.
 *
 *   import { llmGateway, generateTestData, hasApiKey } from '@ai/index';
 */

export { llmGateway } from './gateway/LLMGateway';
export { extractJson } from './utils/jsonExtract';
export { resolveProvider, hasApiKey, loadRegistry } from './config/providers';
export {
    generateTestData,
    type GenerateTestDataOptions,
    type GeneratedTestData,
} from './agents/CustomDataGeneratorAgent';
export {
    analyzeFailure,
    type RcaVerdict,
    type FailureInput,
} from './agents/RCAAgent';
export {
    analyzeFlaky,
    type BuildSummary,
    type FlakyResult,
} from './agents/FlakyTestAnalyzerAgent';
export * from './types';
