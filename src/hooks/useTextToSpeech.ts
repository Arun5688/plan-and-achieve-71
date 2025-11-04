import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string, options?: SpeechSynthesisUtteranceOptions) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

interface SpeechSynthesisUtteranceOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  const loadVoices = useCallback(() => {
    if (isSupported) {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    }
  }, [isSupported]);

  // Load voices on mount and when they change
  if (isSupported) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  const speak = useCallback(
    (text: string, options?: SpeechSynthesisUtteranceOptions) => {
      if (!isSupported) {
        console.warn('Text-to-speech is not supported in this browser');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set options
      if (options?.voice) utterance.voice = options.voice;
      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;
      if (options?.volume) utterance.volume = options.volume;

      // Default to a clear, professional voice if available
      if (!options?.voice && voices.length > 0) {
        const englishVoice = voices.find(
          (voice) =>
            voice.lang.startsWith('en') &&
            (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
  };
};
