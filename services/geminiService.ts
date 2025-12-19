
import { GoogleGenAI, Type } from "@google/genai";
import { Idiom, JielongResponse } from "../types";

const IDIOM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "成语原文" },
    pinyin: { type: Type.STRING, description: "带声调的拼音" },
    explanation: { type: Type.STRING, description: "通俗易懂的含义解释" },
    derivation: { type: Type.STRING, description: "详细的历史典故或出处故事" },
    example: { type: Type.STRING, description: "一个例句" }
  },
  required: ["word", "pinyin", "explanation", "derivation"]
};

export const geminiService = {
  // Uses gemini-3-flash-preview for efficient text validation and response generation
  async validateAndNext(userWord: string, lastWord?: string): Promise<JielongResponse> {
    // Initialize inside the method to ensure fresh configuration and API key access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      任务：成语接龙。
      用户输入的成语是：“${userWord}”。
      ${lastWord ? `上一个成语是：“${lastWord}”，用户输入的第一个字必须是上一个成语的最后一个字。` : "这是开始。"}
      
      请执行以下步骤：
      1. 验证“${userWord}”是否是一个真实的中国成语。
      2. 如果有上一个成语，检查接龙规则（首尾字相同）。
      3. 如果有效，请给出该成语的详细信息。
      4. 接着，找出一个以“${userWord}”最后一个字开头的成语作为接龙，并给出其详细信息。
      
      请确保解释通俗易懂，适合小学生学习，典故要生动有趣。
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValid: { type: Type.BOOLEAN },
              message: { type: Type.STRING, description: "如果无效，说明原因" },
              userIdiom: IDIOM_SCHEMA,
              aiIdiom: IDIOM_SCHEMA
            },
            required: ["isValid"]
          }
        }
      });

      // Directly access .text property from response
      const text = response.text || "{}";
      return JSON.parse(text.trim());
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  },

  async getIdiomDetail(word: string): Promise<Idiom> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `提供成语“${word}”的详细信息：拼音、通俗解释、生动的典故故事。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: IDIOM_SCHEMA
      }
    });
    // Directly access .text property from response
    const text = response.text || "{}";
    return JSON.parse(text.trim());
  }
};