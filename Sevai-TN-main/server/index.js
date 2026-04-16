import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import intentExtraction from './routes/intentExtraction.js';
import schemeSummarizer from './routes/schemeSummarizer.js';
import ocrRoute from './routes/ocr.js';
import { getClaude, MODEL } from './middleware/claudeClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

import ttsEndpoint from './routes/ttsEndpoint.js';

// Mount both under /api
app.use('/api', intentExtraction);
app.use('/api', schemeSummarizer);
app.use('/api', ocrRoute);
app.use('/api', ttsEndpoint);

// Health check — useful for demo day ("is Claude wired up?")
app.get('/api/health', (_, res) => {
  const hasKey = !!getClaude();
  res.json({
    ok: true,
    model: MODEL,
    claude_configured: hasKey,
    message: hasKey
      ? 'Claude API wired up and ready'
      : 'No ANTHROPIC_API_KEY — server running in mock/local fallback mode (demo still works)',
  });
});

app.listen(PORT, () => {
  console.log(`\n🌾  Sevai-Scout server listening on http://localhost:${PORT}`);
  if (!getClaude()) {
    console.log('    ⚠  No ANTHROPIC_API_KEY set — using local fallbacks for summaries & intent.');
    console.log('    Add ANTHROPIC_API_KEY to server/.env to enable live Claude calls.');
  } else {
    console.log(`    ✓  Claude model: ${MODEL}`);
  }
});
