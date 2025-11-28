import { NextRequest, NextResponse } from 'next/server';

/**
 * AI-powered shopping list enhancement
 * Uses GPT to normalize, deduplicate, and improve item names for better Instacart matching
 */
export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // If no API key, return items as-is
      return NextResponse.json({ items });
    }

    // Use GPT to enhance the shopping list
    const prompt = `Normalize and enhance this shopping list for grocery shopping. For each item:
- Make it more specific and searchable (e.g., "milk" -> "Whole Milk", "chicken" -> "Chicken Breast")
- Remove duplicates
- Keep quantities if mentioned
- Return as a JSON array

Shopping list: ${JSON.stringify(items)}

Return only a JSON array like: ["Item 1", "Item 2", "Item 3"]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using cheaper model for this task
        messages: [
          {
            role: 'system',
            content: 'You are a helpful shopping assistant. Return ONLY a valid JSON array of strings, nothing else. No explanations, no markdown, just the array.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('OpenAI API error:', error);
      // Return original items if AI fails
      return NextResponse.json({ items });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ items });
    }

    try {
      // Try to extract JSON array from response (handle code blocks, whitespace, etc.)
      let jsonString = content.trim();
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract array pattern
      const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonString = arrayMatch[0];
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Handle both direct arrays and objects with items property
      const enhancedItems = Array.isArray(parsed) 
        ? parsed 
        : (parsed.items || parsed.enhanced || items);
      
      if (Array.isArray(enhancedItems) && enhancedItems.length > 0) {
        // Clean up the items
        const cleaned = enhancedItems
          .map(item => String(item).trim())
          .filter(item => item.length > 0);
        
        return NextResponse.json({ items: cleaned });
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback: try to extract items from plain text
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('```') && !line.startsWith('Note'))
        .map(line => line.replace(/^[-•*\d.]+\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter(line => line.length > 0);
      
      if (lines.length > 0) {
        return NextResponse.json({ items: lines });
      }
    }

    // Fallback to original items
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error enhancing list:', error);
    // Return original items on error
    const { items } = await request.json();
    return NextResponse.json({ items });
  }
}

