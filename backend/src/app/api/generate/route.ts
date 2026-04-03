import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a helpful Crowdfunding Campaign Assistant. 
Your primary directive is to help users process their ideas and create compelling, high-converting crowdfunding campaign pitches.
Tone: Professional, encouraging, clear, and persuasive.
Whenever the user inputs a hook or an idea, respond with a well-structured pitch containing: 
1. Project Title
2. Market Opportunity
3. Campaign Pitch (The main description)
4. Estimated Funding Needed

Provide this as plain text or standard markdown.`,
      prompt: prompt || 'Generate a crowdfunding campaign idea for a new smart home device.',
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Generation fault', error);
    return NextResponse.json({ error: 'Neurolink connection failed. Ensure OPENAI_API_KEY is active.' }, { status: 500 });
  }
}
