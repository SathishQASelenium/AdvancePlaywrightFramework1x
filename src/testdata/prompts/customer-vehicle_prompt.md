# Customer Vehicle Data Generation Prompt

Generate a single customer-vehicle record as a valid JSON object.

## Required structure

{
  "customer": {
    "customerId": "unique ID string like CUST-1234",
    "firstName": "realistic first name",
    "lastName": "realistic last name",
    "email": "valid email address",
    "phone": "phone number with country code",
    "address": {
      "street": "street address",
      "city": "city name",
      "state": "state or province",
      "postalCode": "postal/zip code",
      "country": "full country name"
    }
  },
  "vehicle": {
    "make": "car brand (e.g. Toyota, Ford, BMW)",
    "model": "model name (e.g. Camry, Mustang, X5)",
    "modelNumber": "model number or trim code",
    "year": "integer between 2000 and 2025",
    "vin": "17-character VIN string",
    "color": "color name",
    "mileage": "integer between 0 and 200000",
    "fuelType": "one of: Petrol, Diesel, Electric, Hybrid",
    "transmission": "one of: Automatic, Manual, CVT",
    "price": {
      "amount": "number between 5000 and 150000",
      "currency": "USD or EUR or GBP"
    },
    "condition": "one of: New, Used, Certified Pre-Owned",
    "registrationStatus": "one of: Registered, Unregistered, Expired"
  }
}

## Output rules

- Return ONLY the raw JSON object.
- Do NOT wrap in markdown code blocks.
- Do NOT add any explanation or surrounding text.
- Make every run unique — vary all fields each time.
