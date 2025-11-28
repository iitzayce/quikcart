import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Parse the text to extract shopping list items
    // This is a simple implementation - you might want to use NLP or AI here
    const items = text
      .split(/[,\n\r]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => {
        // Remove common prefixes and clean up
        return item.replace(/^[-•*]\s*/, '').trim();
      });

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items found in text' },
        { status: 400 }
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
}

