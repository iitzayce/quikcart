import { NextRequest, NextResponse } from 'next/server';
import { LineItem } from '@/lib/instacart';

/**
 * AI-powered processing to convert raw shopping list items into Instacart LineItem format
 * This is the key step that processes user input into the format Instacart API requires
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
      // If no API key, convert simple strings to basic LineItems with required fields
      const lineItems: LineItem[] = items.map(item => {
        const name = typeof item === 'string' ? item.trim() : item.name || String(item);
        const quantity = typeof item === 'object' && 'quantity' in item ? item.quantity : 1;
        const unit = typeof item === 'object' && 'unit' in item ? item.unit : 'count';
        return {
          name,
          quantity,
          unit,
          display_text: `${quantity} ${unit} ${name}`,
        };
      });
      return NextResponse.json({ lineItems });
    }

    // Use GPT to convert items into structured LineItem format for Instacart
    // All fields are required: name, quantity, unit, display_text
    const prompt = `Convert this shopping list into Instacart LineItem format. For each item, extract:
1. name: Normalized product name (e.g., "milk" -> "whole milk", "chicken" -> "chicken breast")
2. quantity: Number (default to 1 if not specified)
3. unit: Unit of measurement (common: "lb", "oz", "count", "can", "pack", "bunch", "loaf", "bottle", "box")
4. display_text: Human-friendly format combining quantity, unit, and name (e.g., "1 pound chicken breast", "2 cans tomato soup")

Valid units include: lb, oz, count, can, pack, bunch, loaf, bottle, box, bag, jar, carton, gallon, quart, pint, cup, fl oz, piece

Input items: ${JSON.stringify(items)}

Return a JSON array with this exact structure (all fields required):
[
  { 
    "name": "product name", 
    "quantity": 1, 
    "unit": "unit", 
    "display_text": "1 unit product name" 
  }
]

Return ONLY the JSON array, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model for this task
        messages: [
          {
            role: 'system',
            content: 'You are a shopping assistant that converts grocery lists into structured format. Always return valid JSON arrays only, no markdown, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // Low temperature for consistent, structured output
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('OpenAI API error:', error);
      // Fallback to basic conversion
      const lineItems: LineItem[] = items.map(item => ({
        name: typeof item === 'string' ? item.trim() : item.name || String(item),
        quantity: 1,
      }));
      return NextResponse.json({ lineItems });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      // Fallback to basic conversion
      const lineItems: LineItem[] = items.map(item => ({
        name: typeof item === 'string' ? item.trim() : item.name || String(item),
        quantity: 1,
      }));
      return NextResponse.json({ lineItems });
    }

    try {
      // Extract JSON array from response
      let jsonString = content.trim();
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonString = arrayMatch[0];
      }

      const parsed = JSON.parse(jsonString);
      const lineItemsArray = Array.isArray(parsed) ? parsed : (parsed.lineItems || parsed.items || []);

      // Validate and clean LineItems - all required fields must be present
      const lineItems: LineItem[] = lineItemsArray
        .filter((item: any) => item && (item.name || item.product))
        .map((item: any) => {
          const name = String(item.name || item.product || '').trim();
          const quantity = item.quantity !== undefined && item.quantity !== null 
            ? Number(item.quantity) 
            : 1;
          const unit = (item.unit && typeof item.unit === 'string') 
            ? item.unit.trim() 
            : 'count';
          const display_text = item.display_text || `${quantity} ${unit} ${name}`;
          
          return {
            name,
            quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
            unit: unit || 'count',
            display_text,
          };
        })
        .filter((item: LineItem) => item.name.length > 0);

      if (lineItems.length > 0) {
        return NextResponse.json({ lineItems });
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

      // Final fallback: convert to basic LineItems with required fields
    const lineItems: LineItem[] = items.map(item => {
      const name = typeof item === 'string' ? item.trim() : item.name || String(item);
      return {
        name,
        quantity: 1,
        unit: 'count',
        display_text: `1 count ${name}`,
      };
    });
    
    return NextResponse.json({ lineItems });
  } catch (error) {
    console.error('Error processing to line items:', error);
    // Return basic conversion on error
    const { items } = await request.json();
    const lineItems: LineItem[] = (items || []).map((item: any) => ({
      name: typeof item === 'string' ? item.trim() : item.name || String(item),
      quantity: 1,
    }));
    return NextResponse.json({ lineItems });
  }
}

