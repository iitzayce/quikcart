import { NextRequest, NextResponse } from 'next/server';
import { generateShoppableLink, generateFallbackLink } from '@/lib/instacart';

interface GenerateLinkRequest {
  items: string[];
  preferences: {
    store?: string;
    zipCode: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { items, preferences }: GenerateLinkRequest = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!preferences?.zipCode) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // Instacart API credentials
    const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
    const INSTACART_PARTNER_ID = process.env.INSTACART_PARTNER_ID;

    let instacartLink: string | null = null;

    if (INSTACART_API_KEY && INSTACART_PARTNER_ID) {
      // Use the Instacart API utility
      instacartLink = await generateShoppableLink(
        {
          items,
          zipCode: preferences.zipCode,
          preferredStore: preferences.store,
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
          items,
          zipCode: preferences.zipCode,
          preferredStore: preferences.store,
        });
      } else {
        return NextResponse.json(
          { 
            error: 'Instacart API not configured. Please set INSTACART_API_KEY and INSTACART_PARTNER_ID environment variables.',
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

