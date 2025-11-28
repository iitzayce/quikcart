# Quick Setup Guide

## Prerequisites

Before you start, make sure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Instacart Developer API credentials
- OpenAI API key (for image OCR and voice transcription)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd Quikcart
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your API keys:

```env
INSTACART_API_KEY=your_instacart_api_key_here
INSTACART_PARTNER_ID=your_instacart_partner_id_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

### 3. Get API Keys

#### Instacart API
1. Visit [https://developer.instacart.com/](https://developer.instacart.com/)
2. Sign up or log in
3. Create a new application
4. Copy your API Key and Partner ID

#### OpenAI API
1. Visit [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again!)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test the Application

1. Try adding items via text input
2. Test image upload (if you have OpenAI API key configured)
3. Test voice input (if you have OpenAI API key configured)
4. Enter your ZIP code
5. Generate an Instacart link

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors in your IDE, try:
1. Restart your TypeScript server (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
2. Run `npm install` again
3. Make sure `node_modules` folder exists

### API Errors

- **Instacart API**: Make sure your API key and Partner ID are correct. Check the Instacart Developer Portal for any API changes.
- **OpenAI API**: Ensure your API key has credits and access to GPT-4 Vision and Whisper models.

### Build Errors

If you get build errors:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Next Steps

1. Review the Instacart API documentation to implement the actual API integration
2. Customize the UI to match your brand
3. Add error handling and user feedback
4. Deploy to Vercel (see README.md)

## Notes

- The Instacart API integration is currently a placeholder. You'll need to implement the actual API calls based on Instacart's latest documentation.
- In development mode, a fallback link will be generated if the Instacart API is not configured.
- For production, you must configure the Instacart API properly.

