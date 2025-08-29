# Vibe Code: The AI Pair Programmer That Sees Everything 😎

Vibe Code is a next-generation collaborative coding environment designed to scale a high-touch "vibe coding" service into a product. It's a web application where developers can join a video call, share their screens, and work directly with a multimodal AI assistant. The "Vibe Agent" has the unique ability to see one or both developers' screens simultaneously, giving it full context to provide holistic, game-changing assistance.

This document serves as the master plan for developing, launching, and scaling Vibe Code.

---

## **Table of Contents**

1.  [Core Features](#core-features)
2.  [Technical Stack](#technical-stack)
3.  [Deployment & Setup](#deployment--setup)
4.  [Usage Instructions](#usage-instructions)
5.  [The Master Plan: From MVP to Platform](#the-master-plan-from-mvp-to-platform)
    *   [Phase 1: The Bulletproof MVP](#phase-1-the-bulletproof-mvp)
    *   [Phase 2: Content Engine & Community Build](#phase-2-content-engine--community-build)
    *   [Phase 3: Monetization & The First 10 Clients](#phase-3-monetization--the-first-10-clients)
    *   [Phase 4: Scale & The Platform Vision](#phase-4-scale--the-platform-vision)
6.  [Growth Strategy: The Income Funnel Plan](#growth-strategy-the-income-funnel-plan)
7.  [Future Concepts: Discord & Twitch Integration](#future-concepts-discord--twitch-integration)

---

## **Core Features**

The current prototype includes several advanced features that form the foundation of the Vibe Code experience.

*   **Flexible Collaboration Modes:**
    *   **Solo Coder & Streamer Mode:** A single user can share their screen and interact with the AI, making it a powerful co-pilot for solo development or live streaming on platforms like Twitch.
    *   **Pair Programming Mode:** Two users can share their screens, giving the AI full context of both sides of an issue (e.g., frontend and backend).
*   **Real-time Shared Agent State:** In pair programming mode, the chat history and code context are perfectly synchronized between both participants using LiveKit Data Channels.
*   **Multimodal Vibe Agent:** The core innovation. The AI agent accepts a complex, multimodal prompt consisting of screen captures, text, and code context.
*   **Streaming AI Responses:** The Vibe Agent responds in real-time, word by word. This makes the agent feel dramatically more alive and conversational.
*   **Session Memory & Context:** The agent remembers the entire conversation history within a session, allowing for natural, follow-up questions.
*   **RAG Codebase Awareness:** A "Code Context" panel allows users to add files from public GitHub repositories. The content of these files is sent to the AI, giving it deep, file-specific knowledge.
*   **Voice Commands:** Users can click a microphone icon to dictate questions to the agent.

## **Technical Stack**

*   **Frontend:** React with TypeScript
*   **Styling:** Tailwind CSS
*   **Real-time Infrastructure:** LiveKit (@livekit/components-react)
*   **AI Model:** Google Gemini API (`gemini-2.5-flash`)
*   **Backend:** Serverless Functions (Node.js) for secure API calls.
*   **Hosting:** Recommended: Vercel or Netlify.

## **Deployment & Setup**

This project is architected for a modern, secure deployment using a frontend hosted on a static provider (like Vercel) and a backend running as serverless functions.

**For complete, step-by-step instructions on how to deploy this application for free, please see the [DEPLOYMENT.md](./DEPLOYMENT.md) file.**

## **Usage Instructions**

1.  **Start/Join a Session:** Open the deployed application, enter a name for your Vibe Room and your name. Click "Vibe". 
2.  **Share Your Screen:** Once inside, use the control bar to enable your camera, microphone, and **most importantly, your screen share**. The Vibe Agent will activate as soon as you start sharing your screen.
3.  **(Optional) Invite a Collaborator:** Your collaborator can join using the same Room Name. The session will seamlessly transition to Pair Programming Mode when they share their screen.
4.  **Interact with the Agent:** Use the Agent Panel to ask questions via text or voice, and add code context from GitHub.

---

## **The Master Plan: From MVP to Platform**

This is the strategic roadmap to evolve Vibe Code from a prototype into a viable, scalable business.

### **Phase 1: The Bulletproof MVP**

**Goal:** Solidify the foundation, making the app secure, reliable, and versatile.

*   **[COMPLETE] Backend Migration:** Refactored to use a secure serverless backend.
*   **[COMPLETE] Implement Shared State:** Used LiveKit's Data Channels for real-time sync.
*   **[COMPLETE] Streaming AI Responses:** Implemented streaming for a real-time feel.
*   **[COMPLETE] Solo Coder & Streamer Mode:** Enabled the agent to work with a single user, unlocking content creation workflows.
*   **[NEXT UP] Create a Real Landing Page:** Design a proper landing page that sells the vision of Vibe Code.
*   **[NEXT UP] UX Polish:** Add clear loading states, error messages, and visual feedback.

### **Phase 2: Content Engine & Community Build**

**Goal:** Build an audience and establish Vibe Code as the leading tool in AI-assisted development.

*   **Launch "Vibe Code Live" on YouTube/Twitch:** A weekly live stream showcasing the app's power in Solo Mode.
*   **Build the "Nugget Factory":** Repurpose stream content into viral clips for YouTube Shorts, TikTok, and Reels.
*   **Create a Discord Community:** Build a hub for users, fans, and potential clients.

### **Phase 3: Monetization & The First 10 Clients**

**Goal:** Convert audience engagement into revenue.

*   **Introduce "Vibe Code Pro":** A SaaS subscription for unlimited sessions and advanced features (e.g., private repo analysis).
*   **Founder-Led Sales:** Use the content platform as a funnel for high-touch consulting services.

### **Phase 4: Scale & The Platform Vision**

**Goal:** Become an indispensable part of the developer workflow.

*   **Deeper IDE Integration:** Develop a **VS Code Extension** that allows the agent to apply suggested code changes directly in the editor.
*   **The "Always-On" Agent:** Architect a server-side agent that can ingest an entire private codebase for proactive suggestions.

## **Growth Strategy: The Income Funnel Plan**

The core marketing strategy is a content-to-product funnel:
1.  **Top of Funnel (Awareness):** Use Solo Mode to create engaging live streams and viral short-form content on YouTube, Twitch, and TikTok.
2.  **Mid Funnel (Community):** Drive the audience to a Discord server to build a loyal community and gather feedback.
3.  **Bottom of Funnel (Conversion):** Monetize the engaged community through a "Vibe Code Pro" SaaS offering and high-ticket consulting services.

## **Future Concepts: Discord & Twitch Integration**

*   **Discord Bot:** A bot that can initiate a Vibe Session from a text channel.
*   **Twitch Bot:** A bot that allows a streamer's audience to interact with the Vibe Agent via chat.