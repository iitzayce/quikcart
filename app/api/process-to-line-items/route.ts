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
      // If no API key, convert simple strings to basic LineItems
      const lineItems: LineItem[] = items.map(item => ({
        name: typeof item === 'string' ? item.trim() : item.name || String(item),
        quantity: typeof item === 'object' && 'quantity' in item ? item.quantity : 1,
      }));
      return NextResponse.json({ lineItems });
    }

    // Use GPT to convert items into structured LineItem format for Instacart
    const prompt = `Convert this shopping list into a structured format for Instacart API. 
For each item, extract:
1. Product name (normalized and searchable, e.g., "milk" -> "Whole Milk")
2. Quantity (if mentioned, default to 1)
3. Unit (if mentioned, e.g., "lb", "oz", "can", "pack", "loaf")

Input items: ${JSON.stringify(items)}

Return a JSON array of objects with this exact structure:
[
  { "name": "Product Name", "quantity": 1, "unit": "optional unit" },
  ...
]

Only include quantity and unit fields if they were specified or can be inferred. Return ONLY the JSON array, no other text.`;

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

      // Validate and clean LineItems
      const lineItems: LineItem[] = lineItemsArray
        .filter((item: any) => item && (item.name || item.product))
        .map((item: any) => {
          const lineItem: LineItem = {
            name: String(item.name || item.product || '').trim(),
          };
          
          if (item.quantity !== undefined && item.quantity !== null) {
            const qty = Number(item.quantity);
            if (!isNaN(qty) && qty > 0) {
              lineItem.quantity = qty;
            }
          }
          
          if (item.unit && typeof item.unit === 'string') {
            lineItem.unit = item.unit.trim();
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

    // Final fallback: convert to basic LineItems
    const lineItems: LineItem[] = items.map(item => ({
      name: typeof item === 'string' ? item.trim() : item.name || String(item),
      quantity: 1,
    }));
    
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

