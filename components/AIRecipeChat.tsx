'use client';

import { useState, useRef, useEffect } from 'react';

interface Recipe {
  title: string;
  ingredients: string[];
  servings: number;
}

interface AIRecipeChatProps {
  onRecipesSelected: (recipes: Recipe[]) => void;
  onClose: () => void;
}

export default function AIRecipeChat({ onRecipesSelected, onClose }: AIRecipeChatProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hi! I can help you find recipes. What would you like to cook? For example, 'Find me Gordon Ramsey recipes for 2 dinners' or 'Italian recipes for 4 people'." }
  ]);
  const [input, setInput] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, recipes]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      // Call GPT to find recipes
      const response = await fetch('/api/find-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });

      const data = await response.json();
      
      if (data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I found ${data.recipes.length} recipe${data.recipes.length > 1 ? 's' : ''}. Please select the ones you'd like to add to your shopping list:`
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || "I couldn't find recipes matching your request. Could you try rephrasing it?"
        }]);
      }
    } catch (error) {
      console.error('Error finding recipes:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecipe = (index: number) => {
    setSelectedRecipes(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleConfirm = () => {
    if (selectedRecipes.length === 0) return;
    const confirmed = selectedRecipes.map(i => recipes[i]);
    onRecipesSelected(confirmed);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#00A862]">Build with AI</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-[#00A862] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Recipe Selection */}
          {recipes.length > 0 && (
            <div className="space-y-3 mt-4">
              {recipes.map((recipe, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleRecipe(idx)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRecipes.includes(idx)
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{recipe.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">Serves {recipe.servings}</p>
                      <p className="text-sm text-gray-700">
                        {recipe.ingredients.slice(0, 3).join(', ')}
                        {recipe.ingredients.length > 3 && ` +${recipe.ingredients.length - 3} more`}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 ${
                      selectedRecipes.includes(idx)
                        ? 'border-[#00A862] bg-[#00A862]'
                        : 'border-gray-300'
                    }`}>
                      {selectedRecipes.includes(idx) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Actions */}
        <div className="p-6 border-t border-gray-200">
          {recipes.length > 0 && selectedRecipes.length > 0 && (
            <button
              onClick={handleConfirm}
              className="w-full mb-4 bg-[#00A862] hover:bg-[#009954] text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Add {selectedRecipes.length} Recipe{selectedRecipes.length > 1 ? 's' : ''} to List
            </button>
          )}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recipes..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A862] focus:border-transparent outline-none"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-6 py-2 bg-[#00A862] hover:bg-[#009954] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

