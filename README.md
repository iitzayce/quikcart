# QuikCart

Transform your shopping list into an Instacart cart with image, text, or voice input.

## Features

- 📝 **Text Input**: Paste or type your shopping list
- 🖼️ **Image Input**: Upload an image of your shopping list (OCR)
- 🎤 **Voice Input**: Dictate your shopping list
- 🛒 **Instacart Integration**: Generate shoppable links to add items directly to your Instacart cart
- ⚙️ **User Preferences**: Set your ZIP code and preferred store

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **OCR**: OpenAI Vision API
- **Speech-to-Text**: OpenAI Whisper API
- **Grocery Delivery**: Instacart Developer API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Instacart Developer API credentials ([Get them here](https://developer.instacart.com/))
- OpenAI API key ([Get it here](https://platform.openai.com/api-keys)) - for image OCR and audio transcription

### Installation

1. Clone the repository or navigate to the QuikCart directory:
   ```bash
   cd Quikcart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Add your API keys to `.env.local`:
   ```env
   INSTACART_API_KEY=your_instacart_api_key_here
   INSTACART_PARTNER_ID=your_instacart_partner_id_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project on [Vercel](https://vercel.com)

3. Add your environment variables in the Vercel project settings:
   - `INSTACART_API_KEY`
   - `INSTACART_PARTNER_ID`
   - `OPENAI_API_KEY`

4. Deploy!

The app will automatically deploy on every push to your main branch.

## API Setup

### Instacart API

1. Sign up for an Instacart Developer account at [https://developer.instacart.com/](https://developer.instacart.com/)
2. Create a new application
3. Copy your API Key and Partner ID
4. Add them to your `.env.local` file

**Note**: The Instacart API integration is currently a placeholder. You'll need to implement the actual API calls based on Instacart's latest documentation. Check their API docs for the correct endpoints and request formats.

### OpenAI API

1. Sign up at [https://platform.openai.com](https://platform.openai.com)
2. Generate an API key
3. Add it to your `.env.local` file

The OpenAI API is used for:
- **Image OCR**: Extracting text from shopping list images using GPT-4 Vision
- **Audio Transcription**: Converting voice recordings to text using Whisper

## Project Structure

```
Quikcart/
├── app/
│   ├── api/
│   │   ├── generate-link/    # Instacart link generation
│   │   ├── process-audio/    # Audio transcription
│   │   ├── process-image/    # Image OCR
│   │   └── process-text/     # Text parsing
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Main page
├── components/
│   ├── input-methods/
│   │   ├── AudioInput.tsx
│   │   ├── ImageInput.tsx
│   │   └── TextInput.tsx
│   ├── InputSelector.tsx
│   ├── InstacartLink.tsx
│   ├── PreferencesPanel.tsx
│   └── ShoppingListDisplay.tsx
├── .env.example
├── next.config.js
├── package.json
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

## Usage

1. **Add Items**: Use one of the three input methods (text, image, or voice) to add items to your shopping list
2. **Set Preferences**: Enter your ZIP code (required) and optionally select a preferred store
3. **Generate Link**: Click "Generate Instacart Link" to create a shoppable link
4. **Shop**: Click the generated link to go to Instacart, select your store, and your cart will be populated!

## Future Enhancements

- [ ] Store user preferences in browser localStorage
- [ ] Support for multiple shopping lists
- [ ] Better item matching and suggestions
- [ ] History of generated links
- [ ] Integration with other grocery delivery services
- [ ] Mobile app version

## License

MIT

