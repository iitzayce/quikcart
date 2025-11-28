/**
 * Instacart API Integration
 * 
 * This module handles communication with the Instacart Developer API
 * for generating shoppable links.
 * 
 * Documentation: https://developer.instacart.com/
 */

export interface InstacartConfig {
  apiKey: string;
  partnerId: string;
}

export interface ShoppingListItem {
  name: string;
  quantity?: number;
}

export interface GenerateLinkParams {
  items: string[] | ShoppingListItem[];
  zipCode: string;
  preferredStore?: string;
}

/**
 * Generate a shoppable Instacart link
 * 
 * @param params - Parameters for link generation
 * @param config - Instacart API configuration
 * @returns The shoppable link URL, or null if generation fails
 */
export async function generateShoppableLink(
  params: GenerateLinkParams,
  config: InstacartConfig
): Promise<string | null> {
  try {
    // TODO: Replace with actual Instacart API endpoint
    // Check the latest Instacart API documentation for the correct endpoint
    // Common endpoints might be:
    // - POST /v1/shoppable_links
    // - POST /v1/carts/create
    
    const response = await fetch('https://api.instacart.com/v1/shoppable_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Partner-Id': config.partnerId,
        'X-Instacart-Partner-Id': config.partnerId, // Some APIs use this header
      },
      body: JSON.stringify({
        items: params.items.map(item => 
          typeof item === 'string' 
            ? { name: item, quantity: 1 }
            : item
        ),
        zip_code: params.zipCode,
        ...(params.preferredStore && { preferred_store: params.preferredStore }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Instacart API error:', error);
      return null;
    }

    const data = await response.json();
    
    // The response structure may vary - adjust based on actual API response
    return data.shoppable_link || data.url || data.link || null;
  } catch (error) {
    console.error('Error calling Instacart API:', error);
    return null;
  }
}

/**
 * Fallback method to generate a basic link when API is not configured
 * This may not work without proper API integration
 */
export function generateFallbackLink(params: GenerateLinkParams): string {
  const itemsParam = params.items
    .map(item => encodeURIComponent(typeof item === 'string' ? item : item.name))
    .join('&item=');
  
  return `https://www.instacart.com/store/partner?item=${itemsParam}&zip=${encodeURIComponent(params.zipCode)}`;
}

