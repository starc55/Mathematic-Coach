import { GoogleGenAI, Modality } from "@google/genai";
import type { ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `
You are a compassionate and patient Socratic math tutor...
`;

export const getSocraticResponse = async (
  prompt: string,
  chatHistory: ChatMessage[],
  isThinkingMode: boolean
): Promise<string> => {
  try {
    const modelName = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config = isThinkingMode
      ? { thinkingConfig: { thinkingBudget: 32768 } }
      : {};

    const contents = [
      ...chatHistory.map(msg => {
        const parts = [];
        if (msg.image) {
          parts.push({
            inlineData: {
              data: msg.image.split(',')[1],
              mimeType: msg.image.split(';')[0].split(':')[1],
            }
          });
        }
        if (msg.content) parts.push({ text: msg.content });
        if (parts.length === 0) parts.push({ text: "" });
        return { role: msg.role, parts };
      }),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        ...config,
        systemInstruction,
      },
    });

    if (!response.candidates || response.candidates.length === 0 || response.candidates[0].finishReason === 'SAFETY') {
      const blockReason = response.candidates?.[0]?.finishReason;
      const safetyRatings = response.candidates?.[0]?.safetyRatings;
      console.warn("Response blocked or empty", { blockReason, safetyRatings });
      throw new Error(`The response was blocked. Reason: ${blockReason || 'Safety concerns'}.`);
    }

    return response.text;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.error?.code === 429) throw new Error("Quota exceeded.");
    if (error.error?.code === 400 && error.error?.message?.includes('api key not valid'))
      throw new Error("Invalid API Key.");
    throw new Error("Failed to get response from AI.");
  }
};

export const getTextToSpeechAudio = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received.");
    return base64Audio;
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    throw new Error("Failed to generate audio.");
  }
};