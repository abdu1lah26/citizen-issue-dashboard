const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const analyzeIssueImage = async (base64Image, mimeType) => {
    const prompt = `You are a civic issue classifier for a city management system in India.

Analyze this image carefully and return ONLY a valid JSON object. No explanation, no markdown, no extra text. Just the JSON.

{
    "category": "one of the exact strings listed",
    "department": "one of the exact strings listed",
    "severity": "Low | Medium | High | Critical",
    "title": "5 to 8 word factual title",
    "description": "1 to 2 sentence factual description",
    "confidence": "float between 0.0 and 1.0",
    "reasoning": "one sentence explaining severity choice"
}

Valid categories: Road Damage, Water Supply, Electricity, Sanitation, Street Lighting, Public Health, Sewage & Drainage, Parks & Gardens, Stray Animal Control, Building & Construction, Other

Valid departments: Roads & Highways, Water Supply, Electricity, Sanitation, Street Lighting, Public Health, Sewage & Drainage, Parks & Gardens, Police, Traffic Management, Other

Severity rules:
- Critical: immediate danger to human life (open manhole, live wire, collapse)
- High: significant disruption (large pothole, broken water main, no electricity)
- Medium: inconvenience but manageable (damaged footpath, dim streetlight)
- Low: minor or aesthetic issue (faded marking, small crack)

If no civic issue is visible, return confidence 0.1 and category Other.`;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llava',
            prompt: prompt,
            images: [base64Image],
            stream: false,
            options: {
                temperature: 0.1,
                num_predict: 300
            }
        })
    });

    const data = await response.json();
    return data.response;
};

// parseAndValidateResponse stays IDENTICAL to before
const VALID_CATEGORIES = [
    'Road Damage',
    'Water Supply',
    'Electricity',
    'Sanitation',
    'Street Lighting',
    'Public Health',
    'Sewage & Drainage',
    'Parks & Gardens',
    'Stray Animal Control',
    'Building & Construction',
    'Other'
];
const VALID_DEPARTMENTS = [
    'Roads & Highways',
    'Water Supply',
    'Electricity',
    'Sanitation',
    'Street Lighting',
    'Public Health',
    'Sewage & Drainage',
    'Parks & Gardens',
    'Police',
    'Traffic Management',
    'Other'
];
const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const parseAndValidateResponse = (rawText) => {
    let cleaned = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
    }
    let parsed = {};
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
        throw new Error('Malformed JSON in AI response');
    }
    const validated = {
        category: VALID_CATEGORIES.includes(parsed.category)
            ? parsed.category
            : 'Other',
        department: VALID_DEPARTMENTS.includes(parsed.department)
            ? parsed.department
            : 'Other',
        severity: VALID_SEVERITIES.includes(parsed.severity)
            ? parsed.severity
            : 'Medium',
        title: typeof parsed.title === 'string' && parsed.title.length > 0
            ? parsed.title.substring(0, 100)
            : 'Civic issue reported',
        description: typeof parsed.description === 'string'
            ? parsed.description.substring(0, 500)
            : 'Issue detected in uploaded image.',
        confidence: typeof parsed.confidence === 'number'
            ? Math.min(1, Math.max(0, parsed.confidence))
            : 0.5,
        reasoning: parsed.reasoning || ''
    };
    return validated;
};

export { analyzeIssueImage, parseAndValidateResponse };
