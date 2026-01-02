
import { GoogleGenAI, Type } from "@google/genai";

export const generateMenuDescription = async (dishName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بۆ ئەم خواردنە ( ${dishName} ) وەسفێکی کورت و سەرنجڕاکێش بە زمانی کوردی (سۆرانی) بنووسە بۆ ناو مینیوی چێشتخانە. تەنها وەسفەکە بنووسە.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || "نەتوانرا وەسفەکە دروست بکرێت.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "هەڵەیەک ڕوویدا لە کاتی دروستکردنی وەسف.";
  }
};

export const suggestNewDish = async (ingredients: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ئەم کەرەستە خاوەیەم هەیە: ${ingredients}. پێشنیاری خواردنێکی نوێم بۆ بکە بە زمانی کوردی سۆرانی لەگەڵ ناو، نرخێکی گریمانەیی (بە دینار)، و وەسفێکی کورت.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.NUMBER },
            description: { type: Type.STRING },
          },
          required: ["name", "price", "description"],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
