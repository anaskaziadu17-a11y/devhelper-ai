import { GoogleGenAI, ChatSession, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT_CHAT, SYSTEM_PROMPT_DIAGNOSTICS, SYSTEM_PROMPT_TEACHER } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createChatSession = async () => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_PROMPT_CHAT,
      temperature: 0.7,
    },
  });
};

export const sendMessageStream = async (chat: any, message: string) => {
  return await chat.sendMessageStream({ message });
};

export const diagnoseError = async (errorLog: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is an error log:\n\n${errorLog}\n\nPlease diagnose this.`,
      config: {
        systemInstruction: SYSTEM_PROMPT_DIAGNOSTICS,
        temperature: 0.2, // Lower temp for more deterministic technical answers
      },
    });
    return response.text;
  } catch (error) {
    console.error("Diagnosis failed", error);
    return "Error: Could not run diagnosis. Please check your network.";
  }
};

export const generateTutorialContent = async (topic: string, level: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a tutorial for: ${topic}. Difficulty level: ${level}.`,
      config: {
        systemInstruction: SYSTEM_PROMPT_TEACHER,
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Tutorial generation failed", error);
    return "Error: Could not generate tutorial.";
  }
};

// Function for determining shell commands based on OS (Simple AI helper)
export const getTerminalHelp = async (query: string, os: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `I am on ${os}. How do I: ${query}? Provide just the command and a one-sentence explanation.`,
  });
  return response.text;
};