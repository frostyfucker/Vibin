import React, { useState, useCallback } from 'react';
import JoinScreen from './components/JoinScreen';
import VibeRoom from './components/VibeRoom';

/*
  ================================================================
  Vibe Code: AI Collaborative Coding - Setup & Usage Instructions
  ================================================================

  *** DEPLOYMENT & SETUP ***
  
  This application is designed for a modern, secure deployment. The frontend does not handle
  any secret keys. It relies on a backend (implemented as serverless functions) to handle
  sensitive operations.

  For a complete, step-by-step guide on how to deploy this application for free on a
  platform like Vercel, please refer to the DEPLOYMENT.md file in the root of this project.

  The backend requires the following environment variables to be set on your hosting provider:
  
  - API_KEY: Your Google Gemini API Key.
  - LIVEKIT_API_KEY: Your LiveKit API Key.
  - LIVEKIT_API_SECRET: Your LiveKit API Secret.
  
  The frontend requires one environment variable:
  
  - VITE_LIVEKIT_SERVER_URL: The public WebSocket URL for your LiveKit server.


  *** USAGE INSTRUCTIONS FOR END-USERS ***

  1.  **Start or Join a Session:**
      - Open the application.
      - On the Join Screen, enter your name and a unique "Vibe Room" name.
      - Click "Vibe".

  2.  **Collaborate:**
      - Your collaborator should use the exact same "Vibe Room" name and enter their own name.
      - Click "Vibe".

  3.  **Inside the Vibe Room:**
      - Once connected, use the control bar to enable your camera, microphone, and MOST IMPORTANTLY, your screen share.
      - BOTH users must be sharing their screen for the AI Vibe Agent to work.

  4.  **Interact with the Vibe Agent:**
      - The Agent Panel is on the right.
      - Type a question into the input field or use the microphone.
      - Click "Ask". The app captures both screens and sends them to the agent.
      - The response appears in the shared chat panel.
*/


export default function App() {
  const [session, setSession] = useState<{
    url: string;
    token: string;
    roomName: string;
    identity: string;
  } | null>(null);

  const handleJoin = useCallback(async (roomName: string, identity: string) => {
    try {
      const url = process.env.VITE_LIVEKIT_SERVER_URL;
      if (!url) {
        const errorMessage = `
          FATAL: VITE_LIVEKIT_SERVER_URL is not defined.

          This is required for the app to connect to your LiveKit server.

          - For local development, create a file named .env.local in the project root and add the following line:
            VITE_LIVEKIT_SERVER_URL=wss://your-livekit-url.livekit.cloud

          - For production, set this as an environment variable in your hosting provider (e.g., Vercel).

          Please see DEPLOYMENT.md for instructions on getting your LiveKit URL.
        `;
        throw new Error(errorMessage);
      }

      // Fetch a short-lived token from our serverless function
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, identity }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to fetch access token: ${response.status} ${errorBody}`);
      }

      const { token } = await response.json();
      
      setSession({ url, token, roomName, identity });

    } catch (error) {
      console.error("Failed to join session:", error);
      alert(`Error joining session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const handleLeave = useCallback(() => {
    setSession(null);
  }, []);

  return (
    <main className="w-full h-screen flex flex-col">
      {session ? (
        <VibeRoom
          serverUrl={session.url}
          token={session.token}
          roomName={session.roomName}
          identity={session.identity}
          onLeave={handleLeave}
        />
      ) : (
        <JoinScreen onJoin={handleJoin} />
      )}
    </main>
  );
}