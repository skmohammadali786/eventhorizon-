import { GoogleGenAI, Type } from "@google/genai";
import { EventItem, Itinerary, EventDetails, FilterOptions } from "../types";

// Bulletproof API Key retrieval that won't crash the browser
const getApiKey = () => {
    try {
        // First check if the polyfill exists
        if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env && (window as any).process.env.API_KEY) {
            return (window as any).process.env.API_KEY;
        }
        // Then check if real process exists (Node/Build env)
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Failed to retrieve API KEY safely", e);
    }
    return '';
};

const apiKey = getApiKey();
// Initialize with dummy if missing so app loads, but calls will fail gracefully
const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_INIT' });

const extractJson = (text: string): any => {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(cleanText); } catch (e) {
        const matchArray = text.match(/\[([\s\S]*)\]/);
        if (matchArray) try { return JSON.parse(matchArray[0]); } catch(e2){}
        const matchObj = text.match(/\{([\s\S]*)\}/);
        if (matchObj) try { return JSON.parse(matchObj[0]); } catch(e3){}
        throw new Error("Could not parse JSON response");
    }
};

export const searchEventsWithGemini = async (query: string, filters?: FilterOptions): Promise<EventItem[]> => {
  if (!apiKey || apiKey === 'DUMMY_KEY_FOR_INIT') {
      console.warn("Gemini API Key missing. Search skipped.");
      return [];
  }
  try {
    const today = new Date().toDateString();
    let filterPrompt = "";
    if (filters && filters.date !== 'all') filterPrompt += ` Date filter: ${filters.date}.`;
    
    const prompt = `Today is ${today}. Find upcoming events matching "${query}" ${filterPrompt}. Return JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              isoDate: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            }
          }
        }
      },
    });
    if (response.text) return extractJson(response.text).map((e: any, i: number) => ({...e, id: e.id || `ai-${i}`, imageUrl: `https://picsum.photos/seed/${e.title.replace(/\s/g,'')}/600/400`, isUserCreated: false }));
    return [];
  } catch (error) { return []; }
};

export const getEventDetails = async (event: EventItem): Promise<EventDetails> => {
  if (event.isUserCreated) return { ...event, fullAddress: event.location, priceRange: event.price };
  if (!apiKey || apiKey === 'DUMMY_KEY_FOR_INIT') return event;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Details for event: ${event.title} at ${event.location}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             priceRange: { type: Type.STRING },
             ageRestriction: { type: Type.STRING },
             organizer: { type: Type.STRING },
             fullAddress: { type: Type.STRING },
             highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
    });
    if (response.text) return { ...event, ...extractJson(response.text) };
    return event;
  } catch (error) { return event; }
};

export const generateItineraryForEvent = async (event: EventItem, role: 'host' | 'attendee' = 'attendee'): Promise<Itinerary> => {
  if (!apiKey || apiKey === 'DUMMY_KEY_FOR_INIT') throw new Error("API Key missing");
  try {
    const prompt = role === 'host' 
        ? `Create a logistical 'Run of Show' itinerary for the HOST of: ${event.title}. The date is ${event.isoDate || 'today'}. Return valid JSON.` 
        : `Create a fun attendee itinerary for: ${event.title}. The date is ${event.isoDate || 'today'}. Return valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING, enum: ['food', 'activity', 'travel', 'event'] }
                }
              }
            }
          }
        }
      }
    });
    if (response.text) return extractJson(response.text);
    throw new Error("No itinerary");
  } catch (error) { throw error; }
};