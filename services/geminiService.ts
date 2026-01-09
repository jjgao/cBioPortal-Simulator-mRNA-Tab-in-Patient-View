import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeneInsight = async (
  geneSymbol: string,
  expressionValue: number,
  cancerType: string
): Promise<AIAnalysisResult> => {
  const expressionLevel = expressionValue > 1.5 ? "high" : expressionValue < -1.5 ? "low" : "normal";
  
  const prompt = `
    Analyze the clinical significance of ${expressionLevel} expression (Z-score: ${expressionValue.toFixed(2)}) of the gene ${geneSymbol} in the context of ${cancerType}.
    
    Provide the response in structured JSON with the following fields:
    - summary: A brief explanation of the gene's function and what this expression level implies biologically.
    - therapeuticImplications: Potential targeted therapies or drug sensitivities/resistance associated with this profile.
    - prognosticValue: Is this typically associated with good or poor prognosis?
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            therapeuticImplications: { type: Type.STRING },
            prognosticValue: { type: Type.STRING },
          },
          required: ["summary", "therapeuticImplications", "prognosticValue"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "Unable to retrieve AI analysis at this time.",
      therapeuticImplications: "N/A",
      prognosticValue: "N/A",
    };
  }
};
