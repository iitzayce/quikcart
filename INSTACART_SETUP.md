# Instacart API Setup Issues

## Current Issue: 403 Forbidden Error

The Instacart API is returning a `403 Forbidden` error, which indicates an authentication problem.

### Your API Key Format
```
keys.OVXKNxThx8pnNEgzuVORgaK9ho5hh2J25Q1MFhs3L2s
```

### Possible Issues

1. **Key Format**: The `keys.` prefix suggests this might be:
   - A key identifier (not the actual secret token)
   - Needs to be used differently than a Bearer token
   - May need a separate secret/token from Instacart's dashboard

2. **Authentication Method**: Instacart might require:
   - Query parameter instead of Bearer token
   - Different header format
   - OAuth flow instead of API key

### What to Check

1. **Instacart Developer Dashboard**:
   - Log into https://developer.instacart.com/
   - Check if there's a "Secret" or "Token" separate from the key ID
   - Look for API key details/credentials page
   - Verify the key has permissions for `/idp/v1/products/products_link` endpoint

2. **API Documentation**:
   - Review: https://docs.instacart.com/developer_platform_api/api/products/create_shopping_list_page/
   - Check authentication section for exact requirements
   - Verify if your API key type has access to this endpoint

3. **Alternative Authentication**:
   - Some Instacart APIs might require OAuth 2.0
   - Check if you need to exchange the API key for an access token
   - Verify if there's a separate authentication endpoint

### Next Steps

1. Check your Instacart Developer Dashboard for:
   - API key details
   - Secret/token (if separate)
   - Permissions/scopes
   - Example requests or SDK

2. Contact Instacart Support if needed:
   - Ask about the `keys.` prefix format
   - Confirm the correct authentication method
   - Request example code/curl command

3. Test the API directly:
   ```bash
   curl -X POST https://api.instacart.com/idp/v1/products/products_link \
     -H "Authorization: Bearer YOUR_KEY_HERE" \
     -H "Content-Type: application/json" \
     -d '{"line_items": [{"name": "Milk", "quantity": 1}]}'
   ```

### Temporary Workaround

Until the API is working, the app will return an error message with details. The fallback link format is not supported by Instacart, so it shows a 404 page.

