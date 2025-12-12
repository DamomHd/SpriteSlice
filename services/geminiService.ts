import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface DetectedGrid {
  rows: number;
  cols: number;
}

export const detectGridStructure = async (base64Image: string): Promise<DetectedGrid> => {
  try {
    // Remove header if present (e.g., "data:image/png;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image which contains a grid of icons or sprites. Count the number of rows and columns of icons. Return the count.",
          },
        ],
      },
      config: {
        systemInstruction: "You are an expert at analyzing sprite sheets and icon grids. Be precise.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rows: { type: Type.INTEGER, description: "The number of rows of icons" },
            cols: { type: Type.INTEGER, description: "The number of columns of icons" },
          },
          required: ["rows", "cols"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text);
    return {
      rows: Math.max(1, result.rows || 1),
      cols: Math.max(1, result.cols || 1),
    };

  } catch (error) {
    console.error("Gemini Detection Error:", error);
    // Fallback to a default 1x1 if detection fails
    return { rows: 1, cols: 1 };
  }
};
