import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to debug Instacart API connection
 */
export async function GET(request: NextRequest) {
  const INSTACART_API_KEY = process.env.INSTACART_API_KEY;
  
  if (!INSTACART_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 400 });
  }

  // Test with minimal request
  const testItems = [
    { name: 'Milk', quantity: 1 }
  ];

  const apiBaseUrl = 'https://api.instacart.com';
  const endpoint = '/idp/v1/products/products_link';
  
  // Handle API key format
  let apiKey = INSTACART_API_KEY.trim();
  let authHeader = `Bearer ${apiKey}`;
  
  // If it starts with "keys.", try both formats
  if (apiKey.startsWith('keys.')) {
    authHeader = `Bearer ${apiKey}`; // Try with prefix
  }

  const headers: HeadersInit = {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const requestBody = {
    line_items: testItems,
  };

  try {
    console.log('Testing Instacart API:', {
      endpoint: `${apiBaseUrl}${endpoint}`,
      authHeaderPrefix: authHeader.substring(0, 20) + '...',
      requestBody,
    });

    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      response: responseData,
      endpoint: `${apiBaseUrl}${endpoint}`,
      requestBody,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      endpoint: `${apiBaseUrl}${endpoint}`,
    }, { status: 500 });
  }
}

