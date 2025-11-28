import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio is required' },
        { status: 400 }
      );
    }

    // TODO: Implement speech-to-text using OpenAI Whisper API or similar
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Speech-to-text service not configured. Please set OPENAI_API_KEY environment variable.',
          items: [] 
        },
        { status: 500 }
      );
    }

    // Convert audio to the format needed for OpenAI Whisper API
    const audioBuffer = await audio.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audio.type || 'audio/webm' });

    // Create FormData for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioBlob, 'audio.webm');
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('language', 'en');
    openAIFormData.append('response_format', 'text');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI Whisper API error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      );
    }

    const transcribedText = await response.text();

    // Parse the transcribed text into items
    const items = transcribedText
      .split(/[,\n\r.]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.replace(/^[-•*]\s*/, '').trim())
      .filter((item) => {
        // Filter out common filler words and short items
        const lowerItem = item.toLowerCase();
        return !['and', 'or', 'the', 'a', 'an'].includes(lowerItem) && item.length > 1;
      });

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items found in audio' },
        { status: 400 }
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}

