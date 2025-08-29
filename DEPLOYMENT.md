# Vibe Code: Deployment & Setup Guide

This guide provides step-by-step instructions to deploy the Vibe Code application for free using Vercel and LiveKit Cloud.

This architecture is secure and scalable:
*   **Frontend:** A static React app hosted on Vercel.
*   **Backend:** Serverless Functions, also hosted on Vercel, to handle secure operations.

---

## **Prerequisites**

Before you begin, you will need free accounts with the following services:

1.  **[GitHub](https://github.com/)**: To store your code and connect to Vercel.
2.  **[Vercel](https://vercel.com/signup)**: To host the frontend and backend.
3.  **[LiveKit Cloud](https://cloud.livekit.io/)**: For real-time video/audio.
4.  **[Google AI Studio](https://aistudio.google.com/)**: To get a Gemini API key.

---

## **Step 1: Get Your API Keys & Credentials**

You need to collect four secret keys and one URL. Keep these safe and ready for Step 4.

1.  **Google Gemini API Key (`API_KEY`)**
    *   Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Click "**Create API key**" and copy the key.

2.  **LiveKit Cloud Credentials**
    *   Sign up or log in to [LiveKit Cloud](https://cloud.livekit.io/).
    *   Create a new project.
    *   In your project settings, find the following:
        *   **API Key (`LIVEKIT_API_KEY`)**: Copy this.
        *   **API Secret (`LIVEKIT_API_SECRET`)**: Copy this.
        *   **WebSocket URL (`VITE_LIVEKIT_SERVER_URL`)**: This is the public URL for your instance (e.g., `wss://your-project-xxxx.livekit.cloud`). Copy this.

---

## **Step 2: Set Up Your Code Repository**

First, get the project code into your own GitHub account.

1.  **Fork the Repository:** Create a fork of the Vibe Code repository on GitHub.
2.  **Clone Locally:** Clone your forked repository to your local machine.
    ```bash
    git clone https://github.com/YOUR_USERNAME/vibe-code.git
    cd vibe-code
    ```

---

## **Step 3: Create the Backend Serverless Functions**

Vercel automatically deploys files inside an `/api` directory as serverless functions. We need to create this directory and the function files.

1.  **Create the `/api` Directory:** In the root of your project, create a new folder named `api`.

2.  **Create the Token Endpoint:** Create a new file named `api/livekit-token.ts` and paste the following code into it:

    ```typescript
    // api/livekit-token.ts
    import { AccessToken } from 'livekit-server-sdk';
    import type { VercelRequest, VercelResponse } from '@vercel/node';

    export default async function handler(req: VercelRequest, res: VercelResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
      }
      
      const { roomName, identity } = req.body;

      if (!roomName || !identity) {
        return res.status(400).json({ message: 'Missing roomName or identity' });
      }

      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        console.error("LiveKit server credentials not configured.");
        return res.status(500).json({ message: 'Server not configured.' });
      }
      
      const at = new AccessToken(apiKey, apiSecret, { identity });
      at.addGrant({ roomJoin: true, room: roomName });
      
      const token = await at.toJwt();

      res.status(200).json({ token });
    }
    ```

3.  **Create the Agent Endpoint:** Create a new file named `api/ask-agent.ts` and paste the following code into it:

    ```typescript
    // api/ask-agent.ts
    import { GoogleGenAI } from "@google/genai";

    // Vercel specific configuration to enable streaming
    export const config = {
      runtime: 'edge',
    };

    export default async function handler(req: Request) {
      if (req.method !== 'POST') {
          // This will be handled by the runtime for `Response` objects
          return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const { prompt, chatHistory, imageDataA, imageDataB, systemInstruction, codeContext } = await req.json();

        const formattedCodeContext = (codeContext || []).map((file: any) => 
          `--- START FILE: ${file.fileName} ---\n${file.content}\n--- END FILE: ${file.fileName} ---`
        ).join('\n\n');
        
        const contextPrompt = formattedCodeContext 
          ? `Here is some relevant code context from the user's repository:\n${formattedCodeContext}\n\n`
          : '';

        const basePrompt = imageDataB 
          ? `Based on the two provided screenshots and the code context, answer the following user prompt:`
          : `Based on the provided screenshot and the code context, answer the following user prompt:`;

        const fullPrompt = `${contextPrompt}${basePrompt}\n\n"${prompt}"`;

        const history = (chatHistory || []).map((msg: any) => ({
          role: msg.author === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));
        
        const userParts = [
            { text: fullPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: imageDataA } },
        ];
        // Conditionally add the second image if it exists
        if(imageDataB) {
            userParts.push({ inlineData: { mimeType: 'image/jpeg', data: imageDataB } });
        }

        const contents: any = [
          ...history,
          { role: 'user', parts: userParts },
        ];
        
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                  systemInstruction: systemInstruction,
                }
              });

              for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                  controller.enqueue(new TextEncoder().encode(chunkText));
                }
              }
              controller.close();
            } catch (error: any) {
                console.error('Error during Gemini stream generation:', error);
                controller.error(error);
            }
          }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

      } catch (error: any) {
        console.error('Error in ask-agent handler:', error);
        return new Response(JSON.stringify({ message: 'Error processing your request', details: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    ```

4.  **Install Backend Dependencies:** Open your terminal in the project root and run this command to add the necessary libraries for the backend functions to work.
    ```bash
    npm install livekit-server-sdk @google/genai @vercel/node
    ```

5.  **Commit and Push:** Save your changes, commit them to git, and push them to your GitHub repository.
    ```bash
    git add .
    git commit -m "feat: Add serverless backend functions"
    git push
    ```

---

## **Step 4: Deploy to Vercel**

1.  **Import Project:** Log in to your Vercel account and click "**Add New...**" > "**Project**". Import your forked GitHub repository.
2.  **Configure Project:** Vercel should automatically detect that you are using Vite and configure the build settings correctly.
3.  **Add Environment Variables:** This is the most important step. Go to the "**Settings**" tab of your new Vercel project and click on "**Environment Variables**". Add the following, making sure they are all available in the "Production" environment.

| Key | Value |
| :--- | :--- |
| `API_KEY` | Your Gemini API Key from Step 1. |
| `LIVEKIT_API_KEY` | Your LiveKit API Key from Step 1. |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret from Step 1. |
| `VITE_LIVEKIT_SERVER_URL` | Your LiveKit WebSocket URL from Step 1. |

4.  **Deploy:** Go to the "**Deployments**" tab and trigger a new deployment. Vercel will build your frontend and deploy your serverless functions.

---

## **Step 5: You're Live!**

Once the deployment is complete, visit your Vercel domain. The application is now live, secure, and ready for collaboration!

---

## **(Optional) Local Development Setup**

To run and test the application on your local machine before deploying, you need to configure your local environment variables and run the Vercel development server, which can execute the serverless functions locally.

1.  **Install Vercel CLI:** If you haven't already, install the Vercel CLI globally.
    ```bash
    npm install -g vercel
    ```

2.  **Create `.env.local` file:** In the root of your project, create a new file named `.env.local`. This file is ignored by git and is used for your local secrets.

3.  **Add all environment variables:** Add all the keys you collected in Step 1 to your `.env.local` file. The Vercel CLI will automatically load these.

    ```
    # .env.local

    # Frontend Variable
    VITE_LIVEKIT_SERVER_URL=wss://your-project-xxxx.livekit.cloud

    # Backend Variables (for serverless functions)
    API_KEY=your_gemini_api_key_here
    LIVEKIT_API_KEY=your_livekit_api_key_here
    LIVEKIT_API_SECRET=your_livekit_api_secret_here
    ```
    *Replace the placeholder values with your actual credentials.*

4.  **Run with Vercel Dev:** Start the development server using the Vercel CLI. This will run the Vite dev server and also make your serverless functions in the `/api` directory available.
    ```bash
    vercel dev
    ```

Now you can open `http://localhost:3000` (or whatever port Vercel indicates) in your browser to use the full application locally.