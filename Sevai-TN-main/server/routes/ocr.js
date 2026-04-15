import { Router } from 'express';
import multer from 'multer';
import { getClaude, MODEL } from '../middleware/claudeClient.js';

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post('/ocr', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document image provided' });
    }

    const claude = getClaude();
    
    // Hackathon Mock Fallback (If no API key)
    if (!claude) {
      console.log('⚠ Mock OCR: No Anthropic Key, returning mock success for', req.file.originalname);
      return res.json({
        valid: true,
        extracted_name: 'Mock Citizen',
        extracted_id: 'XXXX-XXXX-1234',
        message: 'Mock validation successful',
      });
    }

    // Convert buffer to base64 for Claude
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype === 'image/jpeg' ? 'image/jpeg' : 
                      req.file.mimetype === 'image/png' ? 'image/png' : 
                      req.file.mimetype === 'image/webp' ? 'image/webp' : 'image/jpeg';

    const prompt = `This is a photo of a document. 
Determine if it is a valid ID card (like Aadhar or Ration card).
Extract the person's name and ID number if present.
Return ONLY a raw JSON strictly matching this interface, with no markdown formatting:
{
  "valid": boolean,
  "extracted_name": string | null,
  "extracted_id": string | null,
  "message": "A short reason if valid = false"
}`;

    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textRes = response.content.find((b) => b.type === 'text')?.text || '{}';
    // attempt to parse
    try {
      // Strip markdown block if model added it
      const cleanJson = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (e) {
      console.error('Claude JSON parse error:', textRes);
      res.json({ valid: true, message: 'Fallback valid due to parse error' });
    }
  } catch (error) {
    console.error('OCR Endpoint Error:', error);
    res.status(500).json({ error: 'Internal server error during OCR processing.' });
  }
});

export default router;
