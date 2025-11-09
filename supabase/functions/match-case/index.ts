import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseDetails } = await req.json();
    
    // Input validation
    if (!caseDetails || typeof caseDetails !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid case details' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { title, description, crime_type, severity, location, suspect_description, evidence_description } = caseDetails;
    
    if (!title || typeof title !== 'string' || title.length < 5 || title.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid title: must be 5-200 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!description || typeof description !== 'string' || description.length < 20 || description.length > 2000) {
      return new Response(JSON.stringify({ error: 'Invalid description: must be 20-2000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!crime_type || typeof crime_type !== 'string' || crime_type.length < 3 || crime_type.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid crime type: must be 3-100 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return new Response(JSON.stringify({ error: 'Invalid severity: must be low, medium, high, or critical' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (location && (typeof location !== 'string' || location.length > 200)) {
      return new Response(JSON.stringify({ error: 'Invalid location: must be less than 200 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (suspect_description && (typeof suspect_description !== 'string' || suspect_description.length > 1000)) {
      return new Response(JSON.stringify({ error: 'Invalid suspect description: must be less than 1000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (evidence_description && (typeof evidence_description !== 'string' || evidence_description.length > 1000)) {
      return new Response(JSON.stringify({ error: 'Invalid evidence description: must be less than 1000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!caseDetails) {
      return new Response(
        JSON.stringify({ error: 'Case details are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published cases for matching
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('workflow_stage', 'published')
      .order('created_at', { ascending: false })
      .limit(50);

    if (casesError) {
      console.error('Error fetching cases:', casesError);
      throw new Error('Failed to fetch cases');
    }

    // Prepare AI prompt
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert criminal case analyst. Your task is to analyze a submitted case and find the most relevant matching cases from a database based on:
- Crime type similarity
- Modus operandi patterns
- Suspect descriptions
- Location patterns
- Evidence types
- Severity levels

Provide a detailed analysis with similarity scores (0-100) for the top 5 most relevant matches.`;

    const userPrompt = `Analyze this submitted case and find the most relevant matches:

SUBMITTED CASE:
${JSON.stringify(caseDetails, null, 2)}

EXISTING CASES DATABASE:
${JSON.stringify(cases, null, 2)}

Provide your analysis of the top 5 most relevant matches.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_case_matches",
              description: "Return top 5 case matches with similarity scores and reasoning",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        case_id: { type: "string", description: "ID of the matching case" },
                        case_number: { type: "string", description: "Case number" },
                        similarity_score: { type: "number", description: "Similarity score from 0-100" },
                        matching_factors: {
                          type: "array",
                          items: { type: "string" },
                          description: "Key factors that make this case similar"
                        },
                        reasoning: { type: "string", description: "Detailed explanation of why this case matches" }
                      },
                      required: ["case_id", "case_number", "similarity_score", "matching_factors", "reasoning"],
                      additionalProperties: false
                    }
                  },
                  overall_assessment: { type: "string", description: "Overall assessment and recommendations" }
                },
                required: ["matches", "overall_assessment"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_case_matches" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiResult, null, 2));

    // Extract the structured output from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error("No structured output received from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-case function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
