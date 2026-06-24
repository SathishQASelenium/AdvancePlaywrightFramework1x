import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { CustomDataGeneratorAgent } from '@ai/agents/CustomDataGeneratorAgent';

test('AI generates customer-vehicle data @p1 @ai', async () => {
    const dataPath = await CustomDataGeneratorAgent.generate('customer-vehicle_prompt.md');

    // file exists?
    expect(fs.existsSync(dataPath), `File not found: ${dataPath}`).toBe(true);

    const json = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as Record<string, unknown>;

    // top-level keys
    expect(json).toHaveProperty('customer');
    expect(json).toHaveProperty('vehicle');

    const customer = json.customer as Record<string, unknown>;
    const vehicle  = json.vehicle  as Record<string, unknown>;

    // customer fields
    expect(customer).toHaveProperty('firstName');
    expect(customer).toHaveProperty('email');
    expect(customer).toHaveProperty('address');

    // vehicle fields
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('year');
    expect(vehicle).toHaveProperty('price');

    console.log(`[AI Data] ${dataPath}`);
});
