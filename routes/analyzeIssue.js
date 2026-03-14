import express from 'express';
import { parseAndValidateResponse } from '../services/claudeService.js';
import { analyzeIssueImage } from '../services/claudeService.js';
import validateImage from '../middleware/validateImage.js';
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

const checkOllamaHealth = async () => {
    try {
        const res = await fetch('http://localhost:11434/api/tags');
        return res.ok;
    } catch {
        return false;
    }
};

// POST /api/analyze-issue
router.post('/analyze-issue', validateImage, async (req, res) => {
    const { image, mimeType } = req.body;

    // Check Ollama is up before trying
    const ollamaRunning = await checkOllamaHealth();
    if (!ollamaRunning) {
        return res.status(200).json({
            success: false,
            fallback: true,
            message: 'AI analysis unavailable. Please fill the form manually.',
        });
    }

    try {
        // Call Ollama image analysis
        const rawResponse = await analyzeIssueImage(image, mimeType);

        // Parse and validate
        const result = parseAndValidateResponse(rawResponse);

        // Return to frontend
        return res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        // Log for debugging but never expose internals to client
        console.error('AI Analysis Error:', error.message);

        // Return a safe fallback so the form still works
        // User can fill manually if AI fails
        return res.status(200).json({
            success: false,
            fallback: true,
            message: 'AI analysis unavailable. Please fill the form manually.',
            data: {
                category: '',
                department: '',
                severity: 'Medium',
                title: '',
                description: '',
                confidence: 0,
            },
        });
    }
});

export default router;
