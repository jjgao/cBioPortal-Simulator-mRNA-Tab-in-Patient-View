import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SampleContext {
  sampleId: string;
  sampleType: string;
  expressionValue: number;
  mutation?: string;
  cna?: string;
  structuralVariant?: string;
}

export const getGeneInsight = async (
  geneSymbol: string,
  cancerType: string,
  samples: SampleContext[],
  normalTissueContext?: string
): Promise<AIAnalysisResult> => {
  
  const sampleDescriptions = samples.map(s => {
    const expressionLevel = s.expressionValue > 1.5 ? "high" : s.expressionValue < -1.5 ? "low" : "normal";
    let desc = `- Sample ${s.sampleId} (${s.sampleType}): mRNA Expression is ${expressionLevel} (Z-score: ${s.expressionValue.toFixed(2)}).`;
    
    if (s.mutation) desc += ` Detected mutation: ${s.mutation}.`;
    if (s.cna && s.cna !== 'DIPLOID') desc += ` Copy number status: ${s.cna}.`;
    if (s.structuralVariant) desc += ` Structural variant: ${s.structuralVariant}.`;
    
    return desc;
  }).join("\n    ");

  const prompt = `
    Analyze the clinical significance of ${geneSymbol} in a patient with ${cancerType}, focusing on the evolution or differences between samples (e.g., Primary vs Metastasis) if applicable.

    Patient Sample Profiles (Tumor):
    ${sampleDescriptions}

    Normal Tissue Context (GTEx):
    ${normalTissueContext || "Not available."}
    
    Provide the response in structured JSON with the following fields:
    - summary: A brief explanation of the gene's function. Compare the patient's tumor expression to the normal tissue context (e.g., is it overexpressed compared to normal ${cancerType} tissue?) and discuss biological implications.
    - therapeuticImplications: Specific targeted therapies, drug sensitivities, or resistance mechanisms suggested by these profiles.
    - prognosticValue: Is this specific profile (or evolution) typically associated with good or poor prognosis?
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
