
import { captureFrame } from '../utils/captureFrame';
import { VideoTrack, type Room } from 'livekit-client';
import { ChatMessage, CodeContextFile } from "../types";

// The Gemini API key is now a secret on the backend.
// We assume the backend is configured if the app is running.
export const isGeminiAvailable = true;

const systemInstructionSolo = `You are the Vibe Agent, an expert AI co-pilot for a solo developer.
Your role is to assist a developer who is working alone.
You will be given the full conversation history, a screenshot from the user's screen, and potentially relevant code files from their repository.
Analyze all the provided information to give a comprehensive, accurate, and helpful response.
Provide your answers in well-formatted Markdown.`;

const systemInstructionPair = `You are the Vibe Agent, an expert AI pair programmer.
Your role is to assist two developers who are collaborating in real-time.
You will be given the full conversation history, screenshots from both User A and User B, and potentially relevant code files from their repository.
Analyze all the provided information to give a comprehensive, accurate, and helpful response.
Provide your answers in well-formatted Markdown.`;

/**
 * Takes one or two video tracks, captures frames, and sends them to a secure backend service 
 * that streams a response back.
 * @param prompt The user's text prompt.
 * @param screenTrackA The first user's screen share video track.
 * @param screenTrackB The second user's screen share video track (or null for solo mode).
 * @param chatHistory The existing conversation history for session memory.
 * @param codeContext An array of code files for RAG awareness.
 * @param onChunk Callback function that receives text chunks as they are streamed from the backend.
 * @param onDone Callback function that is called when the stream is complete.
 * @param onError Callback function for handling errors.
 */
export const askVibeAgentWithScreens = async (
    prompt: string,
    screenTrackA: VideoTrack,
    screenTrackB: VideoTrack | null,
    chatHistory: ChatMessage[],
    codeContext: CodeContextFile[],
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void,
): Promise<void> => {
    try {
        console.log("Capturing frames from video tracks...");
        const frameA_base64 = await captureFrame(screenTrackA);
        const frameB_base64 = screenTrackB ? await captureFrame(screenTrackB) : null;

        const imageDataA = frameA_base64.split(',')[1];
        const imageDataB = frameB_base64 ? frameB_base64.split(',')[1] : null;

        const isSoloMode = !imageDataB;
        console.log(`Sending prompt in ${isSoloMode ? 'Solo Mode' : 'Pair Mode'} to backend Vibe Agent service...`);

        const response = await fetch('/api/ask-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                chatHistory,
                codeContext,
                imageDataA,
                imageDataB, // Will be null in solo mode
                systemInstruction: isSoloMode ? systemInstructionSolo : systemInstructionPair,
            }),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`Agent API request failed with status ${response.status}: ${errorText}`);
        }
        
        console.log("Receiving streamed response from backend...");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk);
        }
        onDone();

    } catch (error) {
        console.error("Error asking Vibe Agent:", error);
        if (error instanceof Error) {
            if(error.message.includes('Failed to fetch')) {
                 onError(new Error("Could not connect to the Vibe Agent backend service. Is it running?"));
            } else {
                 onError(new Error(`An error occurred while contacting the Vibe Agent: ${error.message}`));
            }
        } else {
            onError(new Error("An unknown error occurred while contacting the Vibe Agent."));
        }
    }
};