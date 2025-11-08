
import React, { useState, useRef } from 'react';
import type { ChatMessage } from '../types';
import { ContentRenderer } from './ContentRenderer';
import { ShareIcon, CheckIcon, SpeakerWaveIcon, StopIcon, BrainIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { getTextToSpeechAudio } from '../services/geminiService';

// Helper to decode base64 string to a Uint8Array
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to decode raw PCM audio data into an AudioBuffer for playback
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000; // Gemini TTS model sample rate
  const numChannels = 1; // Mono
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [audioState, setAudioState] = useState<'idle' | 'fetching' | 'playing'>('idle');

  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const bubbleClasses = isUser
    ? 'bg-slate-100/10 text-slate-100 self-end rounded-2xl rounded-br-none'
    : 'bg-slate-800/40 text-slate-300 self-start rounded-2xl rounded-bl-none';

  const handleShare = async () => {
    // Can't share empty content
    if (!message.content) return;

    const shareData = {
        title: 'Socratic Math Tutor Explanation',
        text: `Here's a math explanation from the Socratic Math Tutor:\n\n${message.content}`,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareData.text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            alert("Failed to copy to clipboard.");
        }
    }
  };

  const handlePlayAudio = async () => {
    // If we're already playing, stop the audio. The onended handler will clean up.
    if (audioSourceRef.current && audioState === 'playing') {
      audioSourceRef.current.stop();
      return;
    }
    
    if (audioState === 'fetching' || !message.content) return;

    try {
      setAudioState('fetching');
      
      // Initialize AudioContext on first interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      const base64Audio = await getTextToSpeechAudio(message.content);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setAudioState('idle');
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;
      setAudioState('playing');

    } catch (error) {
      console.error("Failed to play audio:", error);
      alert("Sorry, we couldn't generate the audio for this explanation.");
      setAudioState('idle');
    }
  };


  return (
    <div className={`group relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="absolute -top-3 right-2 z-10 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        {!isUser && message.content && (
          <>
            <button
              onClick={handlePlayAudio}
              disabled={audioState === 'fetching'}
              className="p-1.5 bg-slate-700/50 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              aria-label={audioState === 'playing' ? 'Stop audio' : 'Play audio explanation'}
            >
              {audioState === 'fetching' && <LoadingSpinner />}
              {audioState === 'playing' && <StopIcon className="w-4 h-4" />}
              {audioState === 'idle' && <SpeakerWaveIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 bg-slate-700/50 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              aria-label="Share explanation"
            >
              {isCopied ? (
                <CheckIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShareIcon className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>
      <div className="relative">
        {!isUser && message.wasThinking && (
            <div className="absolute -top-3 -left-3 z-10" title="Generated with Thinking Mode">
                <BrainIcon className="w-6 h-6 p-1 bg-slate-700/80 backdrop-blur-md text-slate-300 rounded-full border border-white/10" />
            </div>
        )}
        <div className={`max-w-[90%] sm:max-w-xl p-4 border border-white/10 backdrop-blur-md shadow-lg ${bubbleClasses}`}>
            {message.image && (
            <div className="mb-2">
                <img 
                src={message.image} 
                alt="Math problem uploaded by user" 
                className="rounded-lg max-w-full h-auto"
                />
            </div>
            )}
            {message.content && <ContentRenderer content={message.content} />}
        </div>
      </div>
    </div>
  );
};