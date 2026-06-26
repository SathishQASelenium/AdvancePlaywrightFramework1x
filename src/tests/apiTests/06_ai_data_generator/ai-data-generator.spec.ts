import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { generateTestData } from '@ai/agents/CustomDataGeneratorAgent';

test.describe('CustomDataGeneratorAgent @p1 @ai', () => {
    test('generates booking data from prompt and returns valid JSON path', async ({}, testInfo) => {
        const result = await generateTestData({
            structurePath: path.join(__dirname, '../../../testdata/structures/booking.structure.json'),
            prompt: 'Generate one realistic hotel booking record. Vary the guest name, price (100–1000), dates, and additionalneeds each time.',
            name: 'booking',
        });

        await testInfo.attach('ai-data', {
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(result.data, null, 2)),
        });

        expect(fs.existsSync(result.filePath)).toBe(true);

        const data = result.data as Record<string, unknown>;

        expect(data).toHaveProperty('firstname');
        expect(data).toHaveProperty('lastname');
        expect(data).toHaveProperty('totalprice');
        expect(data).toHaveProperty('depositpaid');
        expect(data).toHaveProperty('bookingdates');

        const dates = data.bookingdates as Record<string, unknown>;
        expect(dates).toHaveProperty('checkin');
        expect(dates).toHaveProperty('checkout');

        expect(typeof data.firstname).toBe('string');
        expect(typeof data.totalprice).toBe('number');
        expect(typeof data.depositpaid).toBe('boolean');
    });
});
