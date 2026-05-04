import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import connectToDatabase from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

export async function POST(req: Request) {
  let skills: string[] = [];
  let campaigns: any[] = [];
  
  try {
    const data = await req.json();
    skills = data.skills;
    const availability = data.availability;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'No skills provided for matchmaking' }, { status: 400 });
    }

    await connectToDatabase();
    
    campaigns = await Campaign.find({ 
      status: { $ne: 'Draft' },
      requiredSkills: { $exists: true, $not: { $size: 0 } }
    }).select('_id hook requiredSkills category');

    if (campaigns.length === 0) {
      return NextResponse.json({ matches: [] }, { status: 200 });
    }

    const prompt = `
      You are an expert startup recruiter and matchmaker. 
      I have a user with the following skills: ${skills.join(', ')}.
      They have ${availability || 0} hours per week available.

      Here are the active startup campaigns and the skills they need:
      ${campaigns.map(c => `- ID: ${c._id}, Category: ${c.category}, Pitch: ${c.hook}, Needs: ${(c.requiredSkills || []).join(', ')}`).join('\n')}

      Analyze the user's skills and compare them to each startup's needs. 
      Return a JSON array of the top 3 matching startup IDs, ranked by best fit.
      Only return the JSON array, no markdown formatting or other text. Example: ["id1", "id2"]
    `;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    let matchedIds: string[] = [];
    try {
      matchedIds = JSON.parse(text.trim().replace(/```json/g, '').replace(/```/g, ''));
    } catch (e) {
      console.error('Failed to parse AI output', text);
      return NextResponse.json({ error: 'AI matching format error' }, { status: 500 });
    }

    const matchedCampaigns = await Campaign.find({ _id: { $in: matchedIds } });
    matchedCampaigns.sort((a, b) => matchedIds.indexOf(a._id.toString()) - matchedIds.indexOf(b._id.toString()));

    return NextResponse.json({ matches: matchedCampaigns }, { status: 200 });

  } catch (error: any) {
    console.error('Matchmaking fault', error);
    
    // Check if the error is due to an OpenAI quota exhaustion or API failure
    if (error?.message?.includes('exceeded your current quota') || error?.statusCode === 429 || error?.message?.includes('OpenAI')) {
      console.log('OpenAI quota exceeded. Falling back to basic intersection matchmaking algorithm.');
      
      // Fallback: Score campaigns based on how many required skills match the user's skills
      const userSkillsLower = skills.map((s: string) => s.toLowerCase().trim());
      
      const scoredCampaigns = campaigns.map(c => {
        const reqSkills = c.requiredSkills || [];
        const matchCount = reqSkills.reduce((count: number, rs: string) => {
          return userSkillsLower.includes(rs.toLowerCase().trim()) ? count + 1 : count;
        }, 0);
        return { id: c._id.toString(), score: matchCount };
      });

      // Filter out those with 0 matches, sort by score descending, take top 3
      const fallbackMatchedIds = scoredCampaigns
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => c.id);

      const matchedCampaigns = await Campaign.find({ _id: { $in: fallbackMatchedIds } });
      
      // Maintain sort order
      matchedCampaigns.sort((a, b) => fallbackMatchedIds.indexOf(a._id.toString()) - fallbackMatchedIds.indexOf(b._id.toString()));

      return NextResponse.json({ matches: matchedCampaigns, fallbackUsed: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'System fault on matchmaking' }, { status: 500 });
  }
}
