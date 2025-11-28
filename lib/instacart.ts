/**
 * Instacart API Integration
 * 
 * This module handles communication with the Instacart Developer API
 * for generating shoppable links.
 * 
 * Documentation: https://docs.instacart.com/developer_platform_api/
 * API Endpoint: POST /idp/v1/products/products_link
 */

export interface InstacartConfig {
  apiKey: string;
  partnerId?: string; // May not be required depending on API version
}

/**
 * LineItem format as required by Instacart API
 * Based on: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page/
 */
export interface LineItem {
  name: string;
  quantity?: number;
  unit?: string; // e.g., "can", "lb", "oz", "pack"
  line_item_measurements?: Array<{
    quantity?: number;
    unit?: string;
  }>;
}

export interface GenerateLinkParams {
  items: LineItem[];
  zipCode?: string; // Optional, may be handled by Instacart
}

/**
 * Generate a shoppable Instacart link
 * 
 * API Documentation: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page/
 * 
 * @param params - Parameters for link generation with LineItem objects
 * @param config - Instacart API configuration
 * @returns The shoppable link URL, or null if generation fails
 */
export async function generateShoppableLink(
  params: GenerateLinkParams,
  config: InstacartConfig
): Promise<string | null> {
  try {
    // Instacart Developer Platform API endpoint
    // Base URL: https://api.instacart.com
    const apiBaseUrl = 'https://api.instacart.com';
    const endpoint = '/idp/v1/products/products_link';
    
    // Handle API key format - Instacart may use different auth methods
    let apiKey = config.apiKey.trim();
    
    // Prepare request headers - try different authentication methods
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // If key starts with "keys.", it might need special handling
    // Try multiple authentication methods:
    if (apiKey.startsWith('keys.')) {
      // Method 1: Try as Bearer token with full key
      headers['Authorization'] = `Bearer ${apiKey}`;
      // Also try X-API-Key header as alternative
      headers['X-API-Key'] = apiKey;
      // And try without "keys." prefix
      const keyWithoutPrefix = apiKey.substring(5);
      if (keyWithoutPrefix) {
        // Store for fallback retry
        (headers as any).__fallbackKey = keyWithoutPrefix;
      }
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-Key'] = apiKey;
    }

    // Add Partner ID header if provided (some API versions require it)
    if (config.partnerId) {
      headers['X-Partner-Id'] = config.partnerId;
    }
    
    console.log('Calling Instacart API:', {
      endpoint: `${apiBaseUrl}${endpoint}`,
      itemsCount: params.items.length,
      hasZipCode: !!params.zipCode,
    });

    // Prepare request body with LineItems
    const requestBody = {
      line_items: params.items.map(item => ({
        name: item.name,
        ...(item.quantity && { quantity: item.quantity }),
        ...(item.unit && { unit: item.unit }),
        ...(item.line_item_measurements && { 
          line_item_measurements: item.line_item_measurements 
        }),
      })),
      ...(params.zipCode && { zip_code: params.zipCode }),
    };

    // Try different authentication approaches based on key format
    let response: Response;
    
    // First, try with Bearer token
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    // If 403 and key starts with "keys.", try as query parameter
    if (!response.ok && (response.status === 403 || response.status === 401) && apiKey.startsWith('keys.')) {
      console.log('Trying API key as query parameter...');
      const url = new URL(`${apiBaseUrl}${endpoint}`);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('key', apiKey);
      
      // Remove Authorization header and try with query params
      const queryHeaders = { ...headers };
      delete queryHeaders['Authorization'];
      delete queryHeaders['X-API-Key'];
      
      response = await fetch(url.toString(), {
        method: 'POST',
        headers: queryHeaders,
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint: `${apiBaseUrl}${endpoint}`,
        requestBody: requestBody,
      };
      
      console.error('Instacart API error:', errorDetails);
      
      // Throw error with details for better debugging
      throw new Error(`Instacart API error: ${response.status} - ${JSON.stringify(errorDetails)}`);
    }

    const data = await response.json();
    console.log('Instacart API response:', data);
    
    // Response should contain a URL to the shopping list page
    // Common response fields: url, link, shopping_list_url, etc.
    const link = data.url || data.link || data.shopping_list_url || data.shoppable_link || data.data?.url || null;
    
    if (!link) {
      console.error('No link found in Instacart API response:', data);
      throw new Error('No shoppable link in API response');
    }
    
    return link;
  } catch (error) {
    console.error('Error calling Instacart API:', error);
    return null;
  }
}

/**
 * Fallback method to generate a basic link when API is not configured
 * This is for development/testing only and may not work in production
 */
export function generateFallbackLink(params: GenerateLinkParams): string {
  const itemsParam = params.items
    .map(item => encodeURIComponent(item.name))
    .join('&item=');
  
  const zipParam = params.zipCode ? `&zip=${encodeURIComponent(params.zipCode)}` : '';
  return `https://www.instacart.com/store/partner?item=${itemsParam}${zipParam}`;
}

