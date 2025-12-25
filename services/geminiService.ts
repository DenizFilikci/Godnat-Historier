import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Story, StorySource, AdvancedStoryParams } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.apiKey });

let ambientContext: AudioContext | null = null;
let ambientGain: GainNode | null = null;

export const startAmbientHorror = () => {
  if (ambientContext) return;
  try {
    ambientContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    ambientGain = ambientContext.createGain();
    ambientGain.gain.value = 0.15;
    ambientGain.connect(ambientContext.destination);

    const osc1 = ambientContext.createOscillator();
    const osc2 = ambientContext.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; 
    osc2.type = 'sine';
    osc2.frequency.value = 56.5; 

    const filter = ambientContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(ambientGain);
    osc1.start();
    osc2.start();
  } catch (e) {
    console.warn("Audio failed");
  }
};

export const generateScaryStory = async (
  topic: string, 
  advanced?: AdvancedStoryParams
): Promise<Partial<Story>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let advancedInstructions = "";
  if (advanced && advanced.characters.length > 0) {
    const chars = advanced.characters.map(c => `${c.name} (${c.age} år, ${c.gender})`).join(", ");
    advancedInstructions = `KARAKTERER: ${chars}. LOKATION: ${advanced.location || 'Ukendt'}. ÅRSTAL: ${advanced.year || 'Nutiden'}.`;
  } else {
    advancedInstructions = "Hovedpersonen er en ung person (teenager).";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Du er en moderne gyserforfatter for unge (teens). Skriv en super intens, hurtig og moderne gyserhistorie på dansk. 
    Stilen skal være som en Creepypasta eller TikTok gys - ingen lange kedelige beskrivelser. Gå direkte til rædslen.
    
    EMNE: "${topic}"
    ${advancedInstructions}
    
    REGLER FOR UNG MÅLGRUPPE:
    1. INTET FYLD: Drop lange beskrivelser af vejret eller omgivelserne. Fokusér på handling og chok.
    2. MODERNE: Brug et sprog unge forstår. Ingen gammeldags ordvalg.
    3. TEMPO: Korte, skarpe sætninger. Det skal føles som en film.
    4. LÆNGDE: Hold selve teksten kort og punchy (maks 150 ord).
    5. VALG: Giv to sindssygt svære og uhyggelige valg.
    
    Returnér JSON: { "title": "Kort mega-fed titel", "content": "Start rædslen her...", "choices": ["Valg 1", "Valg 2"], "isFinished": false }`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          choices: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          isFinished: { type: Type.BOOLEAN }
        },
        required: ["title", "content"],
      },
      thinkingConfig: { thinkingBudget: 15000 },
      temperature: 0.9,
    },
  });

  const sources: StorySource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title || "Kilde" });
      }
    });
  }

  try {
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (e) {
    throw new Error("Mørket blokerede historien.");
  }
};

export const continueScaryStoryWithChoice = async (
  currentStory: Story, 
  choice: string
): Promise<Partial<Story>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Fortsæt denne gyser for unge. Gør det vildt og hurtigt.
    
    KONTEKST: "${currentStory.content.slice(-300)}"
    BRUGERENS VALG: "${choice}"
    
    REGLER:
    - Hold det kort (maks 100 ord pr. bid).
    - Maksimal spænding, minimal detalje.
    - Slut af med to nye chokerende valg.
    
    Returnér JSON: { "content": "Næste rædsel...", "choices": ["Valg A", "Valg B"], "isFinished": false }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          choices: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          isFinished: { type: Type.BOOLEAN }
        },
        required: ["content"],
      },
      thinkingConfig: { thinkingBudget: 10000 },
      temperature: 1.0,
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (e) {
    throw new Error("Forbindelsen til skyggerne svigtede.");
  }
};

export const extendScaryStory = async (originalStory: Story, extensionPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Tilføj en hurtig drejning til denne historie: "${originalStory.content}".
    Brugerens ønske: "${extensionPrompt}".
    Gør det kort, skarpt og moderne.`,
    config: { 
        thinkingConfig: { thinkingBudget: 8000 },
        temperature: 0.9 
    },
  });
  return response.text || originalStory.content;
};

export const speakStory = async (text: string, onAudioStart: (source: AudioBufferSourceNode) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Læs denne gyser hurtigt og intenst: ${text.substring(0, 1000)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioData = decodeBase64(base64Audio);
  const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = 1.0; // Standard hurtigt tempo

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1.3;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  onAudioStart(source);
  source.start();
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}