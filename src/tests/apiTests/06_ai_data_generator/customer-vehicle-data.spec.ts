import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { generateTestData } from '@ai/agents/CustomDataGeneratorAgent';

test('AI generates customer-vehicle data @p1 @ai', async (_, testInfo) => {
    const result = await generateTestData({
        structurePath: path.join(__dirname, '../../../testdata/structures/customer-vehicle.structure.json'),
        prompt: 'Generate one realistic customer-vehicle record. Vary all fields each time.',
        name: 'customer-vehicle',
    });

    await testInfo.attach('ai-data', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify(result.data, null, 2)),
    });

    // file exists?
    expect(fs.existsSync(result.filePath), `File not found: ${result.filePath}`).toBe(true);

    const json = result.data as Record<string, unknown>;

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

    console.log(`[AI Data] ${result.filePath}`);
});
