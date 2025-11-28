import { NextRequest, NextResponse } from 'next/server';
import { generateShoppableLink, generateFallbackLink, LineItem } from '@/lib/instacart';

interface GenerateLinkRequest {
  items: string[] | LineItem[];
  preferences: {
    store?: string;
    zipCode?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { items, preferences = {} }: GenerateLinkRequest = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Step 1: Convert items to LineItem format (simple conversion - only 'name' is required per Instacart API)
    let lineItems: LineItem[];
    
    // Check if items are already in LineItem format
    const firstItem = items[0];
    if (typeof firstItem === 'object' && 'name' in firstItem) {
      // Already in LineItem format
      lineItems = items as LineItem[];
    } else {
      // Simple conversion: Instacart API only requires 'name' field
      // Quantity defaults to 1, unit defaults to "each"
      lineItems = (items as string[]).map(item => {
        const name = typeof item === 'string' ? item.trim() : item.name || String(item);
        const lineItem: LineItem = { name };
        
        // Preserve optional fields if they exist
        if (typeof item === 'object') {
          if ('quantity' in item) lineItem.quantity = item.quantity;
          if ('unit' in item) lineItem.unit = item.unit;
          if ('display_text' in item) lineItem.display_text = item.display_text;
        }
        
        return lineItem;
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items found' },
        { status: 400 }
      );
    }

    // Step 2: Generate Instacart link using the API
    const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
    const INSTACART_PARTNER_ID = process.env.INSTACART_PARTNER_ID;

    let instacartLink: string | null = null;

    let apiError: string | null = null;

    if (INSTACART_API_KEY) {
      try {
        // Use the Instacart API utility with LineItems
        instacartLink = await generateShoppableLink(
          {
            items: lineItems,
            title: 'My Shopping List',
            zipCode: preferences.zipCode,
          },
          {
            apiKey: INSTACART_API_KEY,
            partnerId: INSTACART_PARTNER_ID,
          }
        );
      } catch (error) {
        console.error('Error generating Instacart link:', error);
        apiError = error instanceof Error ? error.message : String(error);
      }
    } else {
      apiError = 'INSTACART_API_KEY not configured';
    }

    // If API call failed, return error details instead of fallback
    if (!instacartLink) {
      return NextResponse.json(
        { 
          error: 'Failed to generate Instacart link',
          details: apiError || 'Unknown error',
          fallbackLink: process.env.NODE_ENV === 'development' 
            ? generateFallbackLink({
                items: lineItems,
                zipCode: preferences.zipCode,
              })
            : null,
          note: 'The Instacart API call failed. Check server logs for details.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ link: instacartLink });
  } catch (error) {
    console.error('Error generating Instacart link:', error);
    return NextResponse.json(
      { error: 'Failed to generate Instacart link' },
      { status: 500 }
    );
  }
}

