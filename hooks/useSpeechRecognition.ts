import { useState, useEffect, useRef } from 'react';

// The browser's SpeechRecognition API may be prefixed
// FIX: Cast window to `any` to access non-standard SpeechRecognition APIs without TypeScript errors.
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = true;
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(recognition);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    // FIX: Use `any` for the event type as `SpeechRecognitionEvent` is not a standard DOM type.
    const handleResult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };

    const handleEnd = () => {
      // If it ends unexpectedly, update state
      if (isListening) {
        setIsListening(false);
      }
    };

    rec.addEventListener('result', handleResult);
    rec.addEventListener('end', handleEnd);

    return () => {
      rec.removeEventListener('result', handleResult);
      rec.removeEventListener('end', handleEnd);
    };
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); // Reset transcript
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognition,
  };
};