import { NextRequest, NextResponse } from 'next/server';

interface Recipe {
  title: string;
  ingredients: string[];
  servings: number;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Find recipes based on this request: "${query}"

Return a JSON array of recipes. Each recipe should have:
- title: Recipe name
- ingredients: Array of ingredient names (just the names, no quantities)
- servings: Number of servings

Example format:
[
  {
    "title": "Chicken Parmesan",
    "ingredients": ["chicken breast", "breadcrumbs", "parmesan cheese", "marinara sauce", "mozzarella", "pasta"],
    "servings": 4
  }
]

Return 2-4 recipes that match the request. Return ONLY the JSON array, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful recipe assistant. Return only valid JSON arrays of recipes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to find recipes' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'No recipes found' },
        { status: 404 }
      );
    }

    try {
      let jsonString = content.trim();
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonString = arrayMatch[0];
      }

      const parsed = JSON.parse(jsonString);
      const recipes: Recipe[] = Array.isArray(parsed) ? parsed : [];

      // Validate and clean recipes
      const validRecipes = recipes
        .filter(r => r.title && Array.isArray(r.ingredients) && r.ingredients.length > 0)
        .map(r => ({
          title: String(r.title),
          ingredients: r.ingredients.map((ing: any) => String(ing)),
          servings: Number(r.servings) || 4,
        }));

      if (validRecipes.length === 0) {
        return NextResponse.json(
          { error: 'No valid recipes found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ recipes: validRecipes });
    } catch (parseError) {
      console.error('Error parsing recipes:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse recipes' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error finding recipes:', error);
    return NextResponse.json(
      { error: 'Failed to find recipes' },
      { status: 500 }
    );
  }
}

