import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { CustomDataGeneratorAgent } from '@ai/agents/CustomDataGeneratorAgent';

test.describe('CustomDataGeneratorAgent @p1 @ai', () => {
    test('generates booking data from prompt and returns valid JSON path', async () => {
        const dataPath = await CustomDataGeneratorAgent.generate('booking_prompt.md');

        expect(fs.existsSync(dataPath)).toBe(true);

        const raw = fs.readFileSync(dataPath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;

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
