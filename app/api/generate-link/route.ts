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

    // Step 1: Convert items to LineItem format using AI if needed
    let lineItems: LineItem[];
    
    // Check if items are already in LineItem format
    const firstItem = items[0];
    if (typeof firstItem === 'object' && 'name' in firstItem) {
      // Already in LineItem format
      lineItems = items as LineItem[];
    } else {
      // Need to convert from strings to LineItems using AI
      try {
        const processResponse = await fetch(`${request.nextUrl.origin}/api/process-to-line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        });

        if (processResponse.ok) {
          const processData = await processResponse.json();
          lineItems = processData.lineItems || [];
        } else {
          // Fallback: convert strings to basic LineItems
          lineItems = (items as string[]).map(name => ({
            name: String(name).trim(),
            quantity: 1,
          }));
        }
      } catch (processError) {
        console.error('Error processing items to LineItems:', processError);
        // Fallback: convert strings to basic LineItems
        lineItems = (items as string[]).map(name => ({
          name: String(name).trim(),
          quantity: 1,
        }));
      }
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

    if (INSTACART_API_KEY) {
      // Use the Instacart API utility with LineItems
      instacartLink = await generateShoppableLink(
        {
          items: lineItems,
          zipCode: preferences.zipCode,
        },
        {
          apiKey: INSTACART_API_KEY,
          partnerId: INSTACART_PARTNER_ID,
        }
      );
    }

    // Fallback to basic link if API is not configured or call fails
    if (!instacartLink) {
      if (process.env.NODE_ENV === 'development') {
        // In development, return a fallback link for testing
        instacartLink = generateFallbackLink({
          items: lineItems,
          zipCode: preferences.zipCode,
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Instacart API not configured. Please set INSTACART_API_KEY environment variable.',
          },
          { status: 500 }
        );
      }
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

