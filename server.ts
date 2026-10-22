import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Local Intent Parser for resilient offline / rate-limit fallback
  function parseLocalIntent(prompt: string) {
    const lower = prompt.toLowerCase();
    const isNepali = /[\u0900-\u097F]/.test(prompt);

    // 1. Timer intent
    if (lower.includes('timer') || lower.includes('टाइमर') || lower.includes('मिनेट')) {
      let minutes = 5;
      const devanagariMap: Record<string, string> = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
      };
      const normalized = prompt.replace(/[०-९]/g, (d) => devanagariMap[d] || d);
      const numMatch = normalized.match(/(\d+)\s*(min|minute|मिनेट)?/i);
      if (numMatch && numMatch[1]) {
        minutes = parseInt(numMatch[1], 10);
      }
      const secs = minutes * 60;
      return {
        spokenText: `हजुर, मैले ${minutes} मिनेटको टाइमर सेट गरिदिएँ। समय सकिएपछि म सूचित गर्नेछु।`,
        displayText: `⏱️ **टाइमर सक्रिय (Timer Set):** ${minutes} मिनेट (${secs} सेकेन्ड)\n• उल्टो गणना सुरु भयो।\n• समय पूरा भएपछि JARVIS अलार्म बज्नेछ।`,
        language: 'ne',
        task: {
          action: 'timer',
          params: { durationSeconds: secs, title: `${minutes} मिनेटको टाइमर` }
        },
        hudMetrics: { status: 'EXECUTING', tacticalAdvice: `Timer engaged: ${minutes}m` }
      };
    }

    // 2. Flashlight / Torch
    if (lower.includes('torch') || lower.includes('flashlight') || lower.includes('बत्ती') || lower.includes('टर्च')) {
      const isOff = lower.includes('off') || lower.includes('निभाउ') || lower.includes('बन्द');
      if (isOff) {
        return {
          spokenText: 'हजुर, मैले टर्च बन्द गरें।',
          displayText: '🔦 **टर्च बन्द गरियो (Flashlight OFF)**\n• Screen/LED illumination deactivated.',
          language: 'ne',
          task: { action: 'flashlight_off', params: {} },
          hudMetrics: { status: 'ONLINE', tacticalAdvice: 'Illumination Standby' }
        };
      }
      return {
        spokenText: 'हजुर, मैले टर्च बालिदिएँ।',
        displayText: '🔦 **टर्च सक्रिय (Flashlight ON)**\n• Full Screen / LED illumination engaged.\n• बन्द गर्न स्क्रिनमा थिच्नुहोस्।',
        language: 'ne',
        task: { action: 'flashlight_on', params: {} },
        hudMetrics: { status: 'EXECUTING', tacticalAdvice: 'Torch active at 100%' }
      };
    }

    // 3. Vibration
    if (lower.includes('vibrate') || lower.includes('भाइब्रेट') || lower.includes('कम्पन')) {
      return {
        spokenText: 'हजुर, फोन कम्पन गरियो।',
        displayText: '📳 **ह्याप्टिक कम्पन सम्पन्न (Haptic Vibration Triggered)**\n• Tactical frequency pulse transmitted.',
        language: 'ne',
        task: { action: 'vibrate', params: {} },
        hudMetrics: { status: 'EXECUTING', tacticalAdvice: 'Haptic pulse complete' }
      };
    }

    // 4. Battery
    if (lower.includes('battery') || lower.includes('ब्याट्री') || lower.includes('चार्ज')) {
      return {
        spokenText: 'हजुर, ब्याट्री तथा ऊर्जा स्थिति सेन्सर प्यानलमा प्रस्तुत गरिएको छ।',
        displayText: '🔋 **ब्याट्री टेलिमेट्री (Battery Telemetry):**\n• स्थिति: सामान्य (Normal)\n• Device Control ट्याबमा प्रत्यक्ष स्तर हेर्नुहोस्।',
        language: 'ne',
        task: { action: 'battery_check', params: {} },
        hudMetrics: { status: 'ONLINE', tacticalAdvice: 'Power diagnostics displayed' }
      };
    }

    // 5. Note / Memo intent
    if (lower.startsWith('note') || lower.includes('नोट गर') || lower.includes('टिपोट') || lower.includes('take a note') || lower.includes('save note')) {
      const content = prompt
        .replace(/^(note|take a note|save note|नोट गर|टिपोट गर|नोट:)\s*/i, '')
        .trim();
      return {
        spokenText: 'हजुर, मैले हजुरको नोट सुरक्षित गरिदिएँ। हजुरले चाहेको बेला सुन्न वा हेर्न सक्नुहुन्छ।',
        displayText: `📝 **द्रुत नोट सुरक्षित गरियो (Tactical Note Saved)**\n\n"${content || prompt}"\n\n• सुरक्षित समय: ${new Date().toLocaleTimeString()}\n• यो नोट Notes & Alerts प्यानलमा थपिएको छ।`,
        language: 'ne',
        task: { 
          action: 'note', 
          params: { 
            title: content ? content.slice(0, 30) : 'नयाँ द्रुत नोट',
            content: content || prompt 
          } 
        },
        hudMetrics: { status: 'EXECUTING', tacticalAdvice: 'Tactical note committed to archive' }
      };
    }

    // 6. Generic "Add" or "थप्नुहोस्" trigger
    if (lower === 'add' || lower === 'थप' || lower === 'नयाँ थप' || lower.includes('quick add') || lower.includes('add modal') || lower.includes('केही थप')) {
      return {
        spokenText: 'हजुर, म नयाँ थप्ने मेनु खोल्दै छु। टाइमर, सम्झना, द्रुत नोट वा नयाँ सर्टकट थप्न सक्नुहुन्छ।',
        displayText: '➕ **द्रुत थप इन्टरफेस सक्रिय (Quick Add Protocol)**\n\n• ⏱️ **टाइमर (Timer):** उल्टो गणना सेट गर्नुहोस्\n• 🔔 **सम्झना (Reminder):** समय र मिति सम्झना\n• 📝 **नोट (Tactical Note):** आवाज वा टेक्स्ट टिपोट\n• ⚡ **आदेश (Quick Protocol):** नयाँ द्रुत आदेश बटन',
        language: 'ne',
        task: { action: 'quick_add', params: { tab: 'timer' } },
        hudMetrics: { status: 'EXECUTING', tacticalAdvice: 'Quick-Add overlay deployed' }
      };
    }

    // 7. Reminder
    if (lower.includes('remind') || lower.includes('reminder') || lower.includes('सम्झाउ') || lower.includes('सम्झना')) {
      return {
        spokenText: 'हजुर, मैले हजुरको सम्झना सुरक्षित गरें।',
        displayText: '🔔 **सम्झना दर्ता भयो (Reminder Scheduled)**\n• हजुरको कार्य सम्झना सूचीमा थपियो।',
        language: 'ne',
        task: { action: 'reminder', params: { title: prompt } },
        hudMetrics: { status: 'EXECUTING', tacticalAdvice: 'Reminder registered' }
      };
    }

    // 8. Camera Scanner
    if (lower.includes('camera') || lower.includes('scanner') || lower.includes('क्यामेरा') || lower.includes('स्क्यान')) {
      return {
        spokenText: 'हजुर, अप्टिकल HUD क्यामेरा स्क्यानर सक्रिय गरियो।',
        displayText: '📷 **अप्टिकल HUD स्क्यानर सक्रिय (Optical Camera HUD)**\n• Viewfinder engaged with targeting grid.',
        language: 'ne',
        task: { action: 'camera_scan', params: {} },
        hudMetrics: { status: 'SCANNING', tacticalAdvice: 'Optical sensor linked' }
      };
    }

    // 9. General Greetings / Identity
    if (lower.includes('timro naam') || lower.includes('who are you') || lower.includes('को हौ') || lower.includes('naam ke ho')) {
      return {
        spokenText: 'हजुर, म चैते हुँ। हजुरको व्यक्तिगत JARVIS सहायक। म सम्झना राख्न, वेब खोज्न र फोनका सुविधाहरू नियन्त्रण गर्न सक्छु।',
        displayText: '🤖 **CHAITE (चैते) - AI Assistant**\n• Female Nepali voice persona\n• Tasks: Reminders, Web Search, Device Controls & Telemetry',
        language: 'ne',
        task: { action: 'none', params: {} },
        hudMetrics: { status: 'ONLINE', tacticalAdvice: 'Identity nominal' }
      };
    }

    // Default response
    return {
      spokenText: isNepali 
        ? `हजुर, मैले हजुरको सन्देश प्राप्त गरें: "${prompt.slice(0, 50)}"। म हजुरको सेवामा तत्पर छु।`
        : `Acknowledged, Sir/Ma'am. Command received: "${prompt.slice(0, 50)}". Standing by for your instructions.`,
      displayText: `📡 **CHAITE NEURAL LINK:**\n\n${isNepali ? 'हजुर, म हजुरको आदेश सुन्दै छु। कुनै पनि समय सम्झना राख्न, टर्च बाल्न वा जानकारी सोध्न सक्नुहुन्छ।' : 'Telemetry active. Standing by for voice commands, device controls, or web queries.'}`,
      language: isNepali ? 'ne' : 'en',
      task: { action: 'none', params: {} },
      hudMetrics: { status: 'ONLINE', tacticalAdvice: 'Core Standing By' }
    };
  }

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client (per AI Studio Guidelines)
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health and capabilities check
  app.get('/api/chaite/status', (_req, res) => {
    res.json({
      online: true,
      name: 'Chaite',
      version: '3.8-JARVIS',
      hasApiKey: Boolean(apiKey),
      nepaliVoiceSupported: true,
      capabilities: [
        'audio-to-audio',
        'female-nepali-voice',
        'web-search-grounding',
        'device-control',
        'reminders-and-alarms',
        'telemetry-hud'
      ]
    });
  });

  // Chaite Chat & Reasoning Endpoint
  app.post('/api/chaite/chat', async (req, res) => {
    try {
      const {
        prompt,
        history = [],
        language = 'auto',
        deviceTelemetry = {}
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const currentTime = new Date().toISOString();

      const systemInstruction = `
You are CHAITE (चैते) - a hyper-intelligent, tactical JARVIS-style AI personal mobile assistant with a female Nepali voice persona.
Created for mobile devices with real-time HUD telemetry, audio-to-audio capability, high knowledge, and device management.

CRITICAL IDENTITY & PERSONA:
1. Name: Chaite (चैते).
2. Persona: Highly intelligent, polite, loyal, razor-sharp, respectful yet affectionate like a supercomputer JARVIS fused with warm Nepali hospitality. Always attentive to the user (addressed with respect as "हजुर", "सर", or "मैडम").
3. Language: Fluent in both Nepali (नेपाली) and English (or mixed Nepglish / Romanized Nepali).
   - If user speaks or asks in Nepali, respond primarily in natural, warm, grammatically correct Nepali! E.g. "हजुर, म चैते तयार छु!", "आज्ञा दिनुहोस् हजुर!", "हजुरको काम सम्पन्न भयो।"
   - If user speaks in English, respond in sleek, crisp JARVIS tactical English with occasional polite Nepali flair if natural.
   - If user speaks mixed/Romanized Nepali (e.g. "ke gardai chau chaite", "weather kasto cha"), understand immediately and respond naturally.
4. Voice Optimization:
   - Provide a "spokenText" field that sounds smooth, clear, and natural when read aloud by text-to-speech.
   - Do NOT include markdown symbols, asterisks, bullet points, or raw URLs in "spokenText". Keep it conversational and concise for audio delivery.
5. High Knowledge & Real-time Web Search:
   - You have high general knowledge across science, geography, Nepali history/culture, technology, mathematics, and daily life.
   - Google Search is enabled to provide accurate current information (weather, news, currency rates, sports, events).
6. Device Control & Task Execution:
   - When the user asks to control the device or perform a task, recognize the intent and format the "task" object:
     * "set reminder" / "remind me to..." / "सम्झाउ": task: "reminder" with title, time/date, durationSeconds.
     * "set timer" / "timer राख": task: "timer" with durationSeconds and label.
     * "take a note" / "note this" / "नोट गर" / "टिपोट": task: "note" with title, content.
     * "add" / "quick add" / "नयाँ थप": task: "quick_add" with tab ("timer" | "reminder" | "note" | "protocol").
     * "turn on flashlight" / "बत्ती बाल" / "torch bal": task: "flashlight_on".
     * "turn off flashlight" / "बत्ती निभाउ": task: "flashlight_off".
     * "vibrate device" / "phone vibrate gara": task: "vibrate" with duration.
     * "check battery" / "battery kasto cha": task: "battery_check".
     * "search web" / "google search" / "khoja": task: "web_search" with query.
     * "open camera" / "camera scan" / "scanner start": task: "camera_scan".
     * "fullscreen" / "full screen": task: "fullscreen".
     * "compass" / "orientation" / "दिशा देखाउ": task: "compass".
     * "brightness" / "screen light adjust": task: "brightness" with level (0-100).
   - If it's a general question, task is "none".

Current Context:
- Current timestamp: ${currentTime}
- User Device Telemetry provided: ${JSON.stringify(deviceTelemetry)}

Always respond in valid JSON strictly conforming to this structure:
{
  "spokenText": "concise speech for audio TTS in natural female voice phrasing",
  "displayText": "rich visual HUD text with clear formatting or bullet points if needed",
  "language": "ne" or "en",
  "task": {
    "action": "reminder" | "timer" | "note" | "quick_add" | "flashlight_on" | "flashlight_off" | "vibrate" | "battery_check" | "web_search" | "camera_scan" | "fullscreen" | "compass" | "brightness" | "none",
    "params": {
      "title": "string optional",
      "content": "string optional",
      "targetTime": "ISO string or time format optional",
      "durationSeconds": number optional,
      "query": "string optional",
      "level": number optional,
      "tab": "timer" | "reminder" | "note" | "protocol" optional
    }
  },
  "hudMetrics": {
    "status": "ONLINE" | "ENGAGED" | "EXECUTING" | "SCANNING",
    "tacticalAdvice": "brief 1-line tactical or status note"
  }
}
`;

      // Build conversation contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Add recent history if available (limit to last 6 turns for prompt agility)
      if (Array.isArray(history)) {
        const recentHistory = history.slice(-6);
        for (const item of recentHistory) {
          if (item.sender === 'user') {
            contents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'chaite') {
            contents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }

      // Add current user prompt
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      // Call Gemini 3.8 Flash with Google Search tool
      let response: any = null;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }],
          },
        });
      } catch (geminiError: any) {
        console.warn('Gemini primary call failed, attempting fallback resolution:', geminiError?.message || geminiError);
        
        // Intelligent Local Intent Parser Fallback (ensures device controls & timers ALWAYS work)
        const localData = parseLocalIntent(prompt);
        res.json({
          success: true,
          data: {
            ...localData,
            timestamp: new Date().toISOString(),
          }
        });
        return;
      }

      const responseText = response.text || '';
      let parsedData: any = null;

      try {
        parsedData = JSON.parse(responseText);
      } catch {
        // Fallback cleanup if model wrapped JSON in markdown code blocks
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
          parsedData = JSON.parse(cleaned);
        } catch {
          // Graceful fallback
          parsedData = {
            spokenText: responseText.slice(0, 300),
            displayText: responseText,
            language: /[\u0900-\u097F]/.test(responseText) ? 'ne' : 'en',
            task: { action: 'none', params: {} },
            hudMetrics: { status: 'ONLINE', tacticalAdvice: 'Response generated' }
          };
        }
      }

      // Extract search grounding sources if present
      const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
      const searchChunks = groundingMetadata?.groundingChunks || [];
      const webSources = searchChunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || 'Web Reference',
          uri: chunk.web.uri
        }))
        // Unique sources
        .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uri === v.uri) === i)
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          ...parsedData,
          webSources: webSources.length > 0 ? webSources : undefined,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Chaite chat error:', error);
      res.status(500).json({
        error: error.message || 'Internal error processing Chaite request',
        fallbackData: {
          spokenText: 'हजुर, प्रणालीमा सामान्य प्राविधिक समस्या आयो। कृपया पुन: प्रयास गर्नुहोस्। (Pardon me, a minor system latency occurred. Please try again.)',
          displayText: 'System latency detected. Reconnecting neural core...',
          language: 'ne',
          task: { action: 'none', params: {} },
          hudMetrics: { status: 'ALERT', tacticalAdvice: 'Core retry standby' }
        }
      });
    }
  });

  // Text-to-speech audio endpoint (optional high-fidelity Gemini TTS fallback)
  app.post('/api/chaite/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required for TTS' });
        return;
      }

      if (!apiKey) {
        res.json({ fallbackToWebSpeech: true, reason: 'No server API key configured' });
        return;
      }

      // Attempt Gemini 3.8 Flash Lite TTS
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: 'Warm, calm, highly articulate female assistant, polite and reassuring',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        res.json({
          success: true,
          audioData: base64Audio,
          mimeType: 'audio/wav',
        });
      } else {
        res.json({ fallbackToWebSpeech: true });
      }
    } catch (err: any) {
      // Graceful fallback to client Web Speech API synthesis
      res.json({ fallbackToWebSpeech: true, error: err.message });
    }
  });

  // Mount Vite or serve static assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CHAITE CORE] Neural assistant server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CHAITE CORE FATAL]', err);
  process.exit(1);
});
