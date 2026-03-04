import { GoogleGenAI } from "@google/genai";
import pool from "../config/db.js";

const ai = new GoogleGenAI({});

const MODEL_NAME = "gemini-1.5-flash";
const CONFIDENCE_THRESHOLD = 0.6;

async function getDepartments() {
    const result = await pool.query(
        "SELECT id, name FROM departments ORDER BY id"
    );
    return result.rows;
}

function buildPrompt(title, description, departments) {
    return `
You are an AI civic issue classification engine.

Your task:
- Suggest priority (high, medium, low)
- Suggest department_id ONLY from provided list
- Provide confidence between 0 and 1
- Provide short reasoning

Available Departments:
${departments.map(d => `ID ${d.id}: ${d.name}`).join("\n")}

Issue Title:
${title}

Issue Description:
${description}
`;
}

function validateAIResponse(aiData, departments) {
    const validPriorities = ["high", "medium", "low"];
    const deptIds = departments.map(d => d.id);

    if (!validPriorities.includes(aiData.suggested_priority)) {
        throw new Error("Invalid priority");
    }

    if (!deptIds.includes(aiData.suggested_department_id)) {
        throw new Error("Department ID not in database");
    }

    if (typeof aiData.confidence !== "number") {
        throw new Error("Invalid confidence");
    }

    if (aiData.confidence < 0 || aiData.confidence > 1) {
        throw new Error("Invalid confidence range");
    }

    return true;
}

async function analyzeIssue(title, description) {
    try {
        const departments = await getDepartments();

        const prompt = buildPrompt(title, description, departments);

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        suggested_priority: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                        },
                        suggested_department_id: {
                            type: "number",
                        },
                        confidence: {
                            type: "number",
                        },
                        reasoning: {
                            type: "string",
                        },
                    },
                    required: [
                        "suggested_priority",
                        "suggested_department_id",
                        "confidence",
                        "reasoning",
                    ],
                },
            },
        });

        const text = response.text;
        const aiData = JSON.parse(text);

        validateAIResponse(aiData, departments);

        // Confidence fallback
        if (aiData.confidence < CONFIDENCE_THRESHOLD) {
            aiData.suggested_priority = "medium";
            aiData.reasoning += " | Confidence below threshold → defaulted to medium.";
        }

        return aiData;

    } catch (error) {
        console.error("AI SERVICE ERROR:", error.message);

        // HARD SAFE FALLBACK
        return {
            suggested_priority: "medium",
            suggested_department_id: null,
            confidence: 0,
            reasoning: "AI failed. Default values applied."
        };
    }
}

export { analyzeIssue };