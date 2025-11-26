import { GoogleGenAI, Type } from "@google/genai";
import { EventItem, Itinerary, EventDetails, FilterOptions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to extract JSON from markdown code blocks or raw text
 */
const extractJson = (text: string): any => {
    // First, strip markdown code blocks if they exist (case insensitive)
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
        // Try parsing directly first
        return JSON.parse(cleanText);
    } catch (e) {
        // Find the first '[' and the last ']' for arrays
        const matchArray = text.match(/\[([\s\S]*)\]/);
        if (matchArray) {
            try {
                return JSON.parse(matchArray[0]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON array", e2);
            }
        }
        
        // Find the first '{' and the last '}' for objects
        const matchObj = text.match(/\{([\s\S]*)\}/);
        if (matchObj) {
            try {
                return JSON.parse(matchObj[0]);
            } catch (e3) {
                 console.error("Failed to parse extracted JSON object", e3);
            }
        }
        throw new Error("Could not parse JSON response");
    }
};

/**
 * Searches for events using AI with Search Grounding.
 */
export const searchEventsWithGemini = async (query: string, filters?: FilterOptions): Promise<EventItem[]> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const today = new Date().toDateString();
    
    let filterPrompt = "";
    if (filters) {
        // Advanced Date Logic
        if (filters.date !== 'all') {
            switch (filters.date) {
                case 'today':
                    filterPrompt += ` The event MUST be happening today (${today}).`;
                    break;
                case 'weekend':
                    filterPrompt += ` The event MUST be happening this coming weekend.`;
                    break;
                case 'week':
                    filterPrompt += ` The event MUST be happening within this week.`;
                    break;
                case 'next7days':
                    filterPrompt += ` The event MUST be happening within the next 7 days starting from ${today}.`;
                    break;
                case 'month':
                    filterPrompt += ` The event MUST be happening within this current month.`;
                    break;
            }
        }
        
        if (filters.category !== 'all') {
            filterPrompt += ` filter for category: ${filters.category}.`;
        }
    }

    const prompt = `
      Today is ${today}. Find real UPCOMING events matching: "${query}" ${filterPrompt}.
      
      Use Google Search to find specific upcoming events with dates, times, and locations.
      
      Rules:
      1. events must be in the future relative to ${today}.
      2. 'isoDate' must be a valid ISO 8601 string (YYYY-MM-DDTHH:mm:ss) for sorting purposes.
      3. 'imageUrl' should be left empty (we will handle it).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
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
              date: { type: Type.STRING, description: "Human readable date like 'Fri, Oct 12 at 7pm'" },
              isoDate: { type: Type.STRING, description: "ISO 8601 date format for sorting" },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            }
          }
        }
      },
    });

    if (response.text) {
      const events: EventItem[] = extractJson(response.text);
      if (Array.isArray(events)) {
        return events.map((e, index) => ({
            ...e,
            // Ensure we have a unique ID if the model gets lazy
            id: e.id || `ai-${Date.now()}-${index}`,
            imageUrl: `https://picsum.photos/seed/${e.title.replace(/\s/g, '')}${index}/600/400`,
            isUserCreated: false
        }));
      }
    }
    
    return [];

  } catch (error) {
    console.error("AI Search Error:", error);
    throw error;
  }
};

/**
 * Fetches detailed info for a specific event to populate the detailed view.
 */
export const getEventDetails = async (event: EventItem): Promise<EventDetails> => {
  if (event.isUserCreated) {
      return {
          ...event,
          fullAddress: event.location,
          priceRange: event.price || "See details",
          highlights: ["Community Event", "User Hosted", "Local Gathering"]
      };
  }

  try {
    const modelId = 'gemini-2.5-flash';

    const prompt = `
      I need detailed information for this specific event:
      Title: ${event.title}
      Location: ${event.location}
      Date: ${event.date}

      Use Google Search to find specific details.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
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
             ticketUrl: { type: Type.STRING },
             lineup: { type: Type.ARRAY, items: { type: Type.STRING } },
             highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
    });

    if (response.text) {
        const details = extractJson(response.text);
        return { ...event, ...details };
    }
    
    return event as EventDetails;

  } catch (error) {
    console.error("AI Details Error:", error);
    return event as EventDetails;
  }
};

/**
 * Generates an itinerary for a specific event.
 */
export const generateItineraryForEvent = async (event: EventItem): Promise<Itinerary> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const prompt = `
      Create a fun, detailed one-day itinerary for a user attending this event:
      Event: ${event.title}
      Location: ${event.location}
      Time: ${event.date}
      
      Include pre-event activities (like a meal or sightseeing nearby) and post-event activities.
      The output must strictly follow the JSON schema provided.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
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

    if (response.text) {
      const plan = extractJson(response.text) as Itinerary;
      plan.generatedAt = Date.now();
      return plan;
    }
    
    throw new Error("No itinerary generated");

  } catch (error) {
    console.error("AI Itinerary Error:", error);
    throw error;
  }
};