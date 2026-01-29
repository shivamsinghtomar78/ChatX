import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for voice input and speech synthesis
 */
export const useVoice = (showToast) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort?.();
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Start voice input
    const startListening = useCallback((onResult) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showToast?.('Voice input not supported', 'error');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            showToast?.('Listening...', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult?.(transcript);
            setIsListening(false);
            showToast?.('Voice input received', 'success');
        };

        recognition.onerror = () => {
            setIsListening(false);
            showToast?.('Voice input error', 'error');
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.start();
    }, [showToast]);

    // Stop listening
    const stopListening = useCallback(() => {
        recognitionRef.current?.stop?.();
        setIsListening(false);
    }, []);

    // Speak text
    const speak = useCallback((text) => {
        if (!('speechSynthesis' in window)) {
            showToast?.('Speech synthesis not supported', 'error');
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            showToast?.('Error reading text', 'error');
        };

        window.speechSynthesis.speak(utterance);
    }, [showToast]);

    // Stop speaking
    const stopSpeaking = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return {
        isListening,
        isSpeaking,
        startListening,
        stopListening,
        speak,
        stopSpeaking
    };
};

export default useVoice;
