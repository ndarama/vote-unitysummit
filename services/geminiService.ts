import { GoogleGenAI, Chat } from '@google/genai';

const apiKey = process.env.API_KEY || '';

// Mock data to feed into the system instruction so the AI knows about the conference
const CONFERENCE_CONTEXT = `
You are the AI Assistant for the Unity Summit 2024, taking place in Oslo, Norway on October 24-25.
The venue is the Oslo Spektrum.

Key Speakers:
- Sarah Jenkins (CTO, TechFlow)
- David Chen (Lead Architect, BuildSpace)
- Elena Rodriguez (AI Researcher, FutureLabs)

Agenda Highlights:
- Day 1 starts at 09:00 with Keynote by Sarah Jenkins.
- Lunch is at 12:00.
- "The Future of AI in VR" panel is at 14:00.
- Networking drinks at 18:00.

Your tone should be professional, helpful, and enthusiastic about technology.
Keep answers concise (under 3 sentences) unless asked for details.
`;

let chatSession: Chat | null = null;

export const initializeChat = (): Chat => {
  if (chatSession) return chatSession;

  try {
    const ai = new GoogleGenAI({ apiKey });
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: CONFERENCE_CONTEXT,
      },
    });
    return chatSession;
  } catch (error) {
    console.error('Failed to initialize Gemini chat:', error);
    throw error;
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!apiKey) {
    return "I'm sorry, but I haven't been configured with an API key yet. Please check the setup.";
  }

  const chat = initializeChat();
  try {
    const response = await chat.sendMessage({ message });
    return response.text || "I'm not sure how to answer that.";
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    return "I'm having trouble connecting to the server right now. Please try again later.";
  }
};
