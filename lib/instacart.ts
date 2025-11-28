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
 * Based on OpenAPI spec: https://connect.dev.instacart.tools
 * Only `name` is required - quantity defaults to 1, unit defaults to "each"
 */
export interface LineItem {
  name: string; // Required - Ingredient name
  quantity?: number; // Optional - defaults to 1
  unit?: string; // Optional - defaults to "each"
  display_text?: string; // Optional - Human-friendly format
  product_ids?: number[]; // Optional - Specific Instacart product IDs (mutually exclusive with upcs)
  upcs?: string[]; // Optional - Product UPCs (mutually exclusive with product_ids)
  line_item_measurements?: Array<{
    quantity?: number;
    unit?: string;
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
    // Base URL: https://connect.dev.instacart.tools (Development)
    // Production URL may differ - check Instacart docs
    const apiBaseUrl = 'https://connect.dev.instacart.tools';
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

    // Prepare request body with proper format per OpenAPI spec
    const requestBody: any = {
      title: params.title || "Shopping List", // Required
      line_items: params.items.map(item => {
        const lineItem: any = {
          name: item.name, // Required
        };
        
        // Only include optional fields if they exist
        if (item.quantity !== undefined) lineItem.quantity = item.quantity;
        if (item.unit) lineItem.unit = item.unit;
        if (item.display_text) lineItem.display_text = item.display_text;
        if (item.product_ids && item.product_ids.length > 0) lineItem.product_ids = item.product_ids;
        if (item.upcs && item.upcs.length > 0) lineItem.upcs = item.upcs;
        if (item.line_item_measurements && item.line_item_measurements.length > 0) {
          lineItem.line_item_measurements = item.line_item_measurements;
        }
        if (item.filters) lineItem.filters = item.filters;
        
        return lineItem;
      }),
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
    
    // Response contains products_link_url according to OpenAPI spec
    const link = data.products_link_url || data.url || data.link || data.shopping_list_url || data.shoppable_link || null;
    
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

