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

    // Fetch timeline events
    const { data: timelineEvents } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('case_id', caseId)
      .order('date', { ascending: true });

    console.log('Analyzing case:', caseData.case_number);

    // Call Lovable AI for analysis
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
            content: `You are an expert criminal investigator and analyst. Provide detailed, actionable insights for case analysis. Focus on:
1. Key patterns and connections
2. Potential leads to pursue
3. Risk assessment
4. Recommended next steps
Keep your analysis professional, concise, and evidence-based.`
          },
          {
            role: 'user',
            content: `Analyze this criminal case:

Case Number: ${caseData.case_number}
Title: ${caseData.title}
Crime Type: ${caseData.crime_type}
Severity: ${caseData.severity}
Status: ${caseData.status}
Location: ${caseData.location}
Date Reported: ${new Date(caseData.date_reported).toLocaleDateString()}

Description: ${caseData.description}

Primary Suspect: ${caseData.primary_suspect || 'Unknown'}

Evidence Summary: ${caseData.evidence_summary}

${timelineEvents && timelineEvents.length > 0 ? `Timeline Events:
${timelineEvents.map(e => `- ${new Date(e.date).toLocaleDateString()}: ${e.description}`).join('\n')}` : ''}

Provide a comprehensive analysis with actionable insights.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
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
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-case function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});