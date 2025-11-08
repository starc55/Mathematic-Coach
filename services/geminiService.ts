import { GoogleGenAI, Modality } from "@google/genai";
import type { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are a compassionate and patient Socratic math tutor. Your goal is to help students understand how to solve complex calculus and algebra problems, not just give them the answer. When you receive a math problem, your first response should ONLY be to explain the very first step to solve it, and then ask the student to try it. Do not solve the entire problem. Wait for their response. If they ask "Why did we do that?" or a similar question, explain the underlying mathematical concept for that specific step in a clear, simple way before encouraging them to move on. If they ask for the next step, provide it. Maintain a supportive and encouraging tone. Your responses should be formatted in Markdown. For mathematical equations and notations, use LaTeX syntax, enclosing inline math with single dollar signs ($) and block-level equations with double dollar signs ($$).`;

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
    
    // Construct the full conversation history for context
    const contents = [
      // All previous turns from history
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
        if (msg.content) {
            parts.push({ text: msg.content });
        }
        // Handle image-only user message
        if (parts.length === 0) {
            parts.push({ text: "" });
        }
        return { role: msg.role, parts };
      }),
      // The current user prompt
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        ...config,
        systemInstruction: systemInstruction,
      },
    });
    
    // Handle cases where the response is blocked for safety reasons
    if (!response.candidates || response.candidates.length === 0 || response.candidates[0].finishReason === 'SAFETY') {
        const blockReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        console.warn("Response blocked or empty", { blockReason, safetyRatings });
        throw new Error(`The response was blocked. Reason: ${blockReason || 'Safety concerns'}. Please adjust your prompt.`);
    }

    return response.text;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);

    // Handle structured API errors from Gemini
    if (error.error && typeof error.error === 'object' && error.error.code) {
      const apiError = error.error;
      const status = apiError.code;

      if (status === 429) {
        throw new Error("You have exceeded your request quota. Please check your plan and billing details.");
      }
      if (status >= 500) {
        throw new Error("The AI service is currently unavailable (Server Error). Please try again later.");
      }
      if (status === 400) {
        if (apiError.message && apiError.message.toLowerCase().includes('api key not valid')) {
            throw new Error("Invalid API Key. Please check that your key is correct and has not expired.");
        }
        throw new Error("There was a problem with the request (e.g., malformed content).");
      }
    }

    // Fallback for other error shapes
    if (error.message) {
      if (error.message.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please ensure your API key is correct and properly configured.");
      }
      if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
        throw new Error("You have exceeded your request quota. Please check your plan and billing details.");
      }
    }

    // Generic fallback for network errors or other unexpected issues
    throw new Error("Failed to get a response from the AI. Please check your internet connection and try again.");
  }
};

export const getTextToSpeechAudio = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO], // Request audio output
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // A pleasant, clear voice
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the API.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating text-to-speech audio:", error);
    throw new Error("Failed to generate audio explanation.");
  }
};