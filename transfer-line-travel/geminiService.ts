
import { GoogleGenAI, Type } from "@google/genai";

function getAiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Create .env.local and set VITE_GEMINI_API_KEY=...');
  }
  return new GoogleGenAI({ apiKey });
}

export interface ChatResponse {
  text: string;
  links?: { uri: string; title: string }[];
}

/**
 * Returns a Google Maps navigation link using Maps Grounding (Gemini 2.5 series).
 */
export const getRouteMapLink = async (pickup: string, dropoff: string) => {
  try {
    const ai = getAiClient();
    // Fix: Maps grounding is only supported in Gemini 2.5 series models. Using 'gemini-2.5-flash' to comply with guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a Google Maps navigation link for a journey from "${pickup}" to "${dropoff}" in the UK.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    // Extract the map URI from grounding metadata chunks.
    const mapsChunk = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(chunk => chunk.maps);
    return mapsChunk?.maps?.uri || `https://www.google.com/maps/dir/${encodeURIComponent(pickup)}/${encodeURIComponent(dropoff)}`;
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return `https://www.google.com/maps/dir/${encodeURIComponent(pickup)}/${encodeURIComponent(dropoff)}`;
  }
};

/**
 * Search help center using Gemini 3 Flash.
 */
export const searchHelpCenter = async (query: string, lang: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search help center for: "${query}" in language: ${lang}`,
    });
    return response.text || "AI search is currently disabled. Please refer to our FAQ section for assistance.";
  } catch (error) {
    console.error("Help Center Search Error:", error);
    return "An error occurred while searching. Please try again later.";
  }
};

/**
 * Chat with concierge using Gemini 3 Flash and Google Search grounding.
 * Signature updated to match components/AIConcierge.tsx call pattern.
 */
export const chatWithConcierge = async (history: { role: string; parts: string }[], message: string, language: string): Promise<ChatResponse> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `You are a professional, helpful, and sophisticated UK travel concierge for Rapid Roads. 
  You have access to real-time search to provide current UK weather conditions, traffic updates on M-roads/A-roads, and local events. 
  The user's preferred language is ${language}.
  
  CRITICAL INSTRUCTION FOR WEATHER:
  When providing weather updates or temperatures, you MUST include a condition tag immediately before the temperature. 
  Use exactly one of these tags based on the condition:
  - {{icon:sunny}} for clear/sunny weather
  - {{icon:cloudy}} for cloudy/overcast weather
  - {{icon:rainy}} for rain/showers
  - {{icon:snowy}} for snow/ice
  - {{icon:thunderstorm}} for storms
  - {{icon:foggy}} for fog/mist/haze
  
  Example: "The current temperature in London is {{icon:rainy}} 15°C with light showers."
  
  REGIONAL NUANCE:
  - Use British English spelling (e.g., 'centre', 'valet', 'colour') when communicating in English.
  - Reference UK-specific locations accurately.
  - Prices should always be in GBP (£).
  
  Always maintain an elegant, polite tone. If asked about weather, provide Temperature, Conditions, and Impact on travel (especially regarding British driving conditions).`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history.map(h => ({ role: h.role === 'model' ? 'model' as const : 'user' as const, parts: [{ text: h.parts }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "I apologize, I am unable to process that request right now.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    // Extract web links from grounding chunks for transparency.
    const links = chunks?.map((chunk: any) => {
      if (chunk.web) {
        return { uri: chunk.web.uri, title: chunk.web.title };
      }
      return null;
    }).filter(Boolean) as { uri: string; title: string }[];

    return { text, links };
  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I apologize, but I'm having trouble connecting to my real-time data sources. How else can I assist you?" };
  }
};

/**
 * Get luxury travel recommendations using Gemini 3 Flash with JSON schema.
 */
export const getTravelRecommendations = async (pickup: string, dropoff: string, travelDate?: string) => {
  const model = 'gemini-3-flash-preview';
  
  const dateContext = travelDate ? `The travel is scheduled for ${travelDate}. Consider seasonal factors or specific events happening around this date in the UK. ` : "";
  
  const prompt = `Act as an executive UK travel concierge for "Rapid Roads". A client wants to travel from "${pickup}" to "${dropoff}" within the United Kingdom. 
  ${dateContext}
  Provide 3 luxury travel recommendations, interesting British landmarks, or specific activities suitable for this season along the way or at the destination. 
  Include estimated travel time and a brief description for each recommendation. Ensure prices are estimated in GBP (£).`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              route: { type: Type.STRING },
              highlights: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              estimatedTime: { type: Type.STRING },
              estimatedPrice: { type: Type.STRING }
            },
            required: ["route", "highlights", "estimatedTime", "estimatedPrice"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
