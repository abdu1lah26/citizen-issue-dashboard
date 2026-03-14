// Middleware to validate image before hitting Claude API
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
];

const validateImage = (req, res, next) => {
    const { image, mimeType } = req.body;

    // Check image exists
    if (!image) {
        return res.status(400).json({ error: 'No image provided' });
    }

    // Check mime type
    if (!ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: 'Invalid file type. Use JPG, PNG, or WebP.' });
    }

    // Check size (base64 is ~33% larger than original)
    const approximateSizeBytes = (image.length * 3) / 4;
    if (approximateSizeBytes > MAX_SIZE_BYTES) {
        return res.status(400).json({ error: 'Image too large. Maximum size is 5MB.' });
    }

    next();
};

export default validateImage
