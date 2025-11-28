import { NextRequest, NextResponse } from 'next/server';
import { LineItem } from '@/lib/instacart';

/**
 * AI-powered shopping list enhancement
 * Uses GPT to normalize, deduplicate, and improve item names for better Instacart matching
 * Now returns LineItem format ready for Instacart API
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
      // If no API key, convert to basic LineItems
      const lineItems: LineItem[] = items.map(item => ({
        name: typeof item === 'string' ? item.trim() : item.name || String(item),
        quantity: 1,
      }));
      return NextResponse.json({ items: lineItems.map(li => li.name) });
    }

    // Use GPT to enhance the shopping list and convert to LineItem format
    const prompt = `Normalize and enhance this shopping list for Instacart API. For each item:
- Make product name more specific and searchable (e.g., "milk" -> "Whole Milk", "chicken" -> "Chicken Breast")
- Extract quantity if mentioned (default to 1)
- Extract unit if mentioned (e.g., "lb", "oz", "can")
- Remove duplicates
- Return as JSON array of objects with name, quantity (optional), and unit (optional)

Shopping list: ${JSON.stringify(items)}

Return JSON array: [{"name": "Product", "quantity": 1, "unit": "optional"}]`;

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
      let enhancedArray = Array.isArray(parsed) 
        ? parsed 
        : (parsed.items || parsed.enhanced || []);
      
      // Convert to string array for backward compatibility with UI
      const cleaned = enhancedArray
        .map((item: any) => {
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'object' && item.name) return String(item.name).trim();
          return String(item).trim();
        })
        .filter((item: string) => item.length > 0);
      
      if (cleaned.length > 0) {
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

