# Booking Data Generation Prompt

Generate a single hotel booking record as a valid JSON object.

## Required fields

| Field | Type | Constraints |
|---|---|---|
| `firstname` | string | A realistic first name |
| `lastname` | string | A realistic last name |
| `totalprice` | number | Integer between 100 and 1000 |
| `depositpaid` | boolean | true or false |
| `bookingdates.checkin` | string | A future date in YYYY-MM-DD format |
| `bookingdates.checkout` | string | A date 1 to 7 days after checkin, in YYYY-MM-DD format |
| `additionalneeds` | string | One of: Breakfast, Late checkout, Extra bed |

## Output rules

- Return ONLY the raw JSON object.
- Do NOT wrap in markdown code blocks.
- Do NOT add any explanation or surrounding text.
- Make every run unique — vary the name, price, dates, and needs each time.

## Expected shape

{
  "firstname": "...",
  "lastname": "...",
  "totalprice": ...,
  "depositpaid": ...,
  "bookingdates": {
    "checkin": "YYYY-MM-DD",
    "checkout": "YYYY-MM-DD"
  },
  "additionalneeds": "..."
}
