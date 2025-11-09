import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { caseId } = await req.json();
    
    // Input validation
    if (!caseId || typeof caseId !== 'string' || caseId.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid case ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found');
    }

    console.log('Generating action suggestions for case:', caseData.case_number);

    // Call Lovable AI for suggestions
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert criminal investigator. Suggest 3-5 specific, actionable next steps for investigating a case. Each suggestion should be:
- Specific and actionable
- Based on the evidence and case details
- Prioritized by likelihood of success
Format as a JSON array of objects with "action" and "priority" (high/medium/low) fields.`
          },
          {
            role: 'user',
            content: `Suggest next investigation steps for:

Case: ${caseData.title}
Type: ${caseData.crime_type}
Severity: ${caseData.severity}
Location: ${caseData.location}
Suspect Info: ${caseData.primary_suspect || 'Unknown'}
Evidence: ${caseData.evidence_summary}

Return ONLY a JSON array of action suggestions.`
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI suggestion failed');
    }

    const data = await response.json();
    let suggestions = data.choices[0].message.content;

    // Try to parse JSON from the response
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = suggestions.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        suggestions = jsonMatch[1];
      }
      suggestions = JSON.parse(suggestions);
    } catch (e) {
      console.error('Failed to parse suggestions as JSON:', e);
      // Fallback to basic format
      suggestions = [
        { action: suggestions.substring(0, 200), priority: 'medium' }
      ];
    }

    console.log('Suggestions generated successfully');

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-actions function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});