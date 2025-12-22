import { NextResponse } from "next/server";
import { createVapiAssistant } from "@/lib/vapi/create-assistant";

export async function POST(){
    try{
        const assistant = await createVapiAssistant();
        return NextResponse.json({ assistantId: assistant.id });
    } catch(error){
        console.error(error);
        return NextResponse.json({error: "Failed to create assistant"}, {status: 500});
    }
}