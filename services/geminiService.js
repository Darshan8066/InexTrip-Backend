
const { GoogleGenAI, Type } = require("@google/genai");

// Fix: Always use named parameter for apiKey and use process.env.GEMINI_API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const geminiService = {
    generateTrip: async (params) => {
        console.log("params ::::::::::::",params)
        // Fix: Using gemini-3.1-pro-preview for complex reasoning task (itinerary generation)
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Plan a trip for ${params.travelers} person(s) from ${params.from} to ${params.to} from ${params.startDate} to ${params.endDate}. 
      Budget Level: ${params.budget}. 
      Travel Style: ${params.travelStyle}.
      Mode of Transport: ${params.transportMode}. 
      Additional Context: ${params.description}.
      
      Please provide a detailed itinerary and estimate the total budget in INR (Indian Rupees) for the entire trip including transport, accommodation, and food.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dayPlan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.INTEGER },
                                    activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    meals: {
                                        type: Type.OBJECT,
                                        properties: {
                                            breakfast: { type: Type.STRING },
                                            lunch: { type: Type.STRING },
                                            dinner: { type: Type.STRING }
                                        },
                                        required: ["breakfast", "lunch", "dinner"]
                                    }
                                },
                                required: ["day", "activities", "meals"]
                            }
                        },
                        hotels: { type: Type.ARRAY, items: { type: Type.STRING } },
                        foodPlaces: { type: Type.ARRAY, items: { type: Type.STRING } },
                        estimatedTotal: { type: Type.NUMBER, description: "Total estimated cost in INR" },
                        pickupPoint: { type: Type.STRING },
                        dropPoint: { type: Type.STRING }
                    },
                    required: ["dayPlan", "hotels", "foodPlaces", "estimatedTotal", "pickupPoint", "dropPoint"]
                }
            }
        });

        console.log("response ::::::::::::",response)
        try {
            // Fix: Direct property access to response.text (no method call)
            const data = JSON.parse(response.text || '{}');
            return {
                ...data,
                tripType: 'AI',
                from: params.from,
                to: params.to,
                startDate: params.startDate,
                endDate: params.endDate,
                budget: params.budget,
                travelers: params.travelers,
                travelStyle: params.travelStyle,
                price: data.estimatedTotal,
                transportMode: params.transportMode,
                images: [`https://picsum.photos/seed/${params.to}/800/600`]
            };
        } catch (e) {
            console.error("Failed to parse Gemini response", e);
            throw new Error("AI could not generate trip at this time.", { cause: e });
        }
    },

    refineTrip: async (currentTrip, prompt) => {
        // Fix: Using gemini-3.1-pro-preview for complex reasoning task
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Refine this trip based on user feedback: "${prompt}". Current Trip Details: ${JSON.stringify(currentTrip)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dayPlan: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                        hotels: { type: Type.ARRAY, items: { type: Type.STRING } },
                        price: { type: Type.NUMBER }
                    }
                }
            }
        });
        // Fix: Direct property access to response.text
        return JSON.parse(response.text || '{}');
    }
};
module.exports = { geminiService }