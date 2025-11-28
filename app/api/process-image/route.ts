import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // TODO: Implement OCR using a service like Tesseract.js, Google Vision API, or OpenAI Vision
    // For now, returning a placeholder response
    
    // Example: Using OpenAI Vision API (you'll need to set OPENAI_API_KEY in env)
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      // Fallback: Return error with instructions
      return NextResponse.json(
        { 
          error: 'OCR service not configured. Please set OPENAI_API_KEY environment variable.',
          items: [] 
        },
        { status: 500 }
      );
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageMimeType = image.type || 'image/jpeg';

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all shopping list items from this image. Return only a comma-separated list of items, one per line. Do not include any other text or formatting.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to process image with OCR' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';

    // Parse the extracted text into items
    const items = extractedText
      .split(/[,\n\r]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.replace(/^[-•*]\s*/, '').trim());

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items found in image' },
        { status: 400 }
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

