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
    
    // Use the API key as provided - it includes the "keys." prefix
    const apiKey = config.apiKey.trim();
    
    // Prepare request headers - use Bearer token authentication
    const headers: HeadersInit = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add Partner ID header if provided
    if (config.partnerId) {
      headers['X-Partner-Id'] = config.partnerId;
    }
    
    console.log('Calling Instacart API:', {
      endpoint: `${apiBaseUrl}${endpoint}`,
      itemsCount: params.items.length,
      hasZipCode: !!params.zipCode,
      authHeader: `Bearer ${apiKey.substring(0, 10)}...`,
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

    // Make the API request
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

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

