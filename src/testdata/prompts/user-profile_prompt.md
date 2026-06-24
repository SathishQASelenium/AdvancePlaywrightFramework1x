# User Profile Data Generation Prompt

Generate a single user profile record as a valid JSON object.

## Required fields

| Field | Type | Constraints |
|---|---|---|
| `username` | string | Minimum 3 characters, realistic username |
| `email` | string | Valid email format (user@domain.com) |
| `firstName` | string | A realistic first name |
| `lastName` | string | A realistic last name |
| `age` | integer | Between 18 and 120 |
| `country` | string | Full country name, minimum 2 characters |

## Output rules

- Return ONLY the raw JSON object.
- Do NOT wrap in markdown code blocks.
- Do NOT add any explanation or surrounding text.
- Make every run unique — vary all fields each time.

## Expected shape

{
  "username": "...",
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "age": ...,
  "country": "..."
}
