import http from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Endpoint for Islamic AI Assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.json({
        reply: 'عذراً، مفتاح Gemini API غير مكوّن. يرجى إعداد المفتاح في إعدادات البيئة (Secrets) لتفعيل الإجابات الذكية.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `أنت مساعد إسلامي وموجه شرعي حكيم وموثوق. أجب عن السؤال التالي بلغة عربية فصحى مبسطة ووسطية ودقيقة استناداً إلى القرآن الكريم والسنة النبوية الصحيحة والفقه الإسلامي المعتدل:\n\n${prompt}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: 'أنت مساعد إسلامي وموجه شرعي ذكي وموثوق يقدم إجابات وسطية دقيقة ومستندة للقرآن والسنة.',
      }
    });

    const reply = response.text || 'عذراً، لم أتمكن من توليد إجابة في الوقت الحالي.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Setup Vite middleware in development
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        allowedHosts: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const portNum = Number(process.env.PORT || 3000);
  httpServer.listen(portNum, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${portNum}`);
  });
}

startServer();
