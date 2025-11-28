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
  name: string; // Required - Ingredient name
  quantity: number; // Required - How much of the item
  unit: string; // Required - Units (see valid units in Instacart docs)
  display_text: string; // Required - Human-friendly format (e.g., "1 pound chicken breast")
  product_ids?: number[]; // Optional - Specific Instacart product IDs
  upcs?: string[]; // Optional - Product UPCs
  line_item_measurements?: Array<{
    quantity: number;
    unit: string;
  }>;
  filters?: {
    brand_filters?: string[];
    health_filters?: (
      | "ORGANIC" | "GLUTEN_FREE" | "FAT_FREE" |
      "VEGAN" | "KOSHER" | "SUGAR_FREE" | "LOW_FAT"
    )[];
  };
}

export interface GenerateLinkParams {
  items: LineItem[];
  title?: string; // Required - Title of the shopping list
  image_url?: string; // Optional - Thumbnail image for the page
  link_type?: "shopping_list" | "recipe"; // Optional - Default is "shopping_list"
  expires_in?: number; // Optional - Days until link expires (max 365)
  instructions?: string[]; // Optional - Displayed on landing page
  landing_page_configuration?: {
    partner_linkback_url?: string;
    enable_pantry_items?: boolean;
  };
  zipCode?: string; // Optional - ZIP code for store selection
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

    // Prepare request body with proper format
    const requestBody: any = {
      title: params.title || "Shopping List", // Required
      line_items: params.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        display_text: item.display_text,
        ...(item.product_ids && item.product_ids.length > 0 && { product_ids: item.product_ids }),
        ...(item.upcs && item.upcs.length > 0 && { upcs: item.upcs }),
        ...(item.line_item_measurements && item.line_item_measurements.length > 0 && { 
          line_item_measurements: item.line_item_measurements 
        }),
        ...(item.filters && { filters: item.filters }),
      })),
    };

    // Add optional fields
    if (params.image_url) requestBody.image_url = params.image_url;
    if (params.link_type) requestBody.link_type = params.link_type;
    if (params.expires_in) requestBody.expires_in = params.expires_in;
    if (params.instructions && params.instructions.length > 0) {
      requestBody.instructions = params.instructions;
    }
    if (params.landing_page_configuration) {
      requestBody.landing_page_configuration = params.landing_page_configuration;
    }
    if (params.zipCode) requestBody.zip_code = params.zipCode;

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

