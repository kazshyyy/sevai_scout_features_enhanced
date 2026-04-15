import { Router } from 'express';

const router = Router();

router.post('/tts', async (req, res) => {
  const { text, lang } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const useTamil = lang === 'ta';

  // Check for Bhashini keys (Government API)
  const ulcaApiKey = process.env.BHASHINI_ULCA_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const authKey = process.env.BHASHINI_AUTH_KEY;

  if (ulcaApiKey && userId && authKey) {
    console.log(`[TTS] Routing through Government Bhashini Pipeline for: ${text.substring(0, 20)}...`);
    try {
      const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authKey,
          'userID': userId,
          'ulcaApiKey': ulcaApiKey
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: "tts",
            config: {
              language: { sourceLanguage: useTamil ? "ta" : "en" }
            }
          }],
          inputData: { input: [{ source: text }] }
        })
      });
      
      const data = await response.json();
      if (data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent) {
        const audioBase64 = data.pipelineResponse[0].audio[0].audioContent;
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        res.set('Content-Type', 'audio/wav');
        return res.send(audioBuffer);
      }
    } catch (e) {
      console.error('[TTS] Bhashini API Failed:', e.message);
      // Fall through to fallback
    }
  }

  // Hackathon Fallback -> Google Translate Public Endpoint
  console.log(`[TTS] Using Public Hackathon Fallback API for: ${text.substring(0, 20)}...`);
  try {
    const url = new URL('https://translate.google.com/translate_tts');
    url.searchParams.append('ie', 'UTF-8');
    url.searchParams.append('tl', useTamil ? 'ta' : 'en');
    url.searchParams.append('client', 'tw-ob');
    url.searchParams.append('q', text);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Fallback HTTP Status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error('[TTS] Overall TTS Error:', err.message);
    res.status(500).json({ error: 'Failed to generate audio via any endpoint.' });
  }
});

export default router;
