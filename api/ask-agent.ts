// api/ask-agent.ts
import { GoogleGenAI } from "@google/genai";

// Vercel specific configuration to enable streaming
export const config = {
  runtime: 'edge',
};

// FIX: The handler signature has been updated for the Vercel Edge runtime.
// It now uses the standard `Request` type, which has a `.json()` method,
// and returns a `Response` object directly.
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
    
    // Dynamically adjust the prompt based on whether it's a solo or pair session
    const basePrompt = imageDataB 
      ? `Based on the two provided screenshots (from User A and User B) and the code context, answer the following user prompt:`
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
    // Conditionally add the second image if it exists (for pair programming mode)
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