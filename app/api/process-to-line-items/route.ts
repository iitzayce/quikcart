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
      // If no API key, convert simple strings to basic LineItems (only name required)
      const lineItems: LineItem[] = items.map(item => {
        const name = typeof item === 'string' ? item.trim() : item.name || String(item);
        const lineItem: LineItem = { name };
        
        // Add optional fields only if they exist
        if (typeof item === 'object' && 'quantity' in item) {
          lineItem.quantity = item.quantity;
        }
        if (typeof item === 'object' && 'unit' in item) {
          lineItem.unit = item.unit;
        }
        
        return lineItem;
      });
      return NextResponse.json({ lineItems });
    }

    // Use GPT to convert items into structured LineItem format for Instacart
    // Per OpenAPI spec, only 'name' is required - quantity defaults to 1, unit defaults to "each"
    const prompt = `Convert this shopping list into Instacart LineItem format. For each item, extract:
1. name: Normalized product name (REQUIRED) - e.g., "milk" -> "whole milk", "chicken" -> "chicken breast"
2. quantity: Number (optional, default is 1)
3. unit: Unit of measurement (optional, default is "each") - e.g., "lb", "oz", "gallon", "can", "pack", "bunch", "loaf", "bottle", "box", "bag", "jar", "carton"
4. display_text: Human-friendly format (optional) - e.g., "1 pound chicken breast", "2 cans tomato soup"

Valid units: each, teaspoon, tablespoon, ounce, pound, gram, kilogram, cup, gallon, quart, pint, fl oz, can, pack, bunch, loaf, bottle, box, bag, jar, carton, piece

Input items: ${JSON.stringify(items)}

Return a JSON array. Only 'name' is required, include quantity/unit/display_text only if specified:
[
  { 
    "name": "product name"
    // Add quantity, unit, display_text only if specified
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
      // Fallback to basic conversion with all required fields
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
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      // Fallback to basic conversion with all required fields
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

      // Validate and clean LineItems - only 'name' is required per OpenAPI spec
      const lineItems: LineItem[] = lineItemsArray
        .filter((item: any) => item && (item.name || item.product))
        .map((item: any) => {
          const name = String(item.name || item.product || '').trim();
          const lineItem: LineItem = { name };
          
          // Add optional fields only if they exist and are valid
          if (item.quantity !== undefined && item.quantity !== null) {
            const qty = Number(item.quantity);
            if (!isNaN(qty) && qty > 0) {
              lineItem.quantity = qty;
            }
          }
          
          if (item.unit && typeof item.unit === 'string' && item.unit.trim()) {
            lineItem.unit = item.unit.trim();
          }
          
          if (item.display_text && typeof item.display_text === 'string') {
            lineItem.display_text = item.display_text.trim();
          }
          
          // Add optional advanced fields
          if (item.product_ids && Array.isArray(item.product_ids)) {
            lineItem.product_ids = item.product_ids;
          }
          if (item.upcs && Array.isArray(item.upcs)) {
            lineItem.upcs = item.upcs;
          }
          if (item.line_item_measurements && Array.isArray(item.line_item_measurements)) {
            lineItem.line_item_measurements = item.line_item_measurements;
          }
          if (item.filters) {
            lineItem.filters = item.filters;
          }
          
          return lineItem;
        })
        .filter((item: LineItem) => item.name.length > 0);

      if (lineItems.length > 0) {
        return NextResponse.json({ lineItems });
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

      // Final fallback: convert to basic LineItems (only name required)
    const lineItems: LineItem[] = items.map(item => ({
      name: typeof item === 'string' ? item.trim() : item.name || String(item),
    }));
    
    return NextResponse.json({ lineItems });
  } catch (error) {
    console.error('Error processing to line items:', error);
    // Return basic conversion on error (only name required)
      try {
        const { items: errorItems } = await request.json();
        const lineItems: LineItem[] = (errorItems || []).map((item: any) => ({
          name: typeof item === 'string' ? item.trim() : item.name || String(item),
        }));
        return NextResponse.json({ lineItems });
      } catch {
        return NextResponse.json({ error: 'Failed to process items' }, { status: 500 });
      }
  }
}

