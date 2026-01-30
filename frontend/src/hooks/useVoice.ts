"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for voice input and speech synthesis
 */
export const useVoice = (showToast?: (message: string, type?: 'success' | 'error' | 'info') => void) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Cleanup
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort?.();
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const startListening = useCallback((onResult: (text: string) => void) => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast?.('Voice input not supported', 'error');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            showToast?.('Listening...', 'info');
        };

        recognition.onresult = (event: any) => {
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

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop?.();
        setIsListening(false);
    }, []);

    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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

    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
