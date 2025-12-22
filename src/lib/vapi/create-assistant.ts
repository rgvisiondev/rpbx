import { VapiClient } from "@vapi-ai/server-sdk";

export async function createVapiAssistant(){

    const vapi = new VapiClient({ token: process.env.VAPI_PRIVATE_KEY! });

    const assistant = await vapi.assistants.create({
        name: "RPBX Customer Support Assistant",
        model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [{ role: 'system', content: 'You are John, a customer service assistant for RioPlex Business Exchange'}]
        },
        voice: { provider: '11labs', voiceId: '2BsEFcU7jUhLaUwV4h7l' },
        firstMessage: 'Hi there! This is John from RPBX customer support. How can I help you today?'
    });
    
    return assistant;
}