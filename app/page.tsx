'use client';

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';
import ShoppingListDisplay from '@/components/ShoppingListDisplay';
import InstacartLink from '@/components/InstacartLink';

export default function Home() {
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    zipCode: '',
  });
  const [instacartLink, setInstacartLink] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleListGenerated = (items: string[]) => {
    setShoppingList(items);
    setShowPreferences(true);
  };

  const handleBuild = async () => {
    if (shoppingList.length === 0) {
      return;
    }

    if (!preferences.zipCode) {
      alert('Please enter your ZIP code');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: shoppingList,
          preferences,
        }),
      });

      const data = await response.json();
      if (data.link) {
        setInstacartLink(data.link);
      } else {
        alert(data.error || 'Failed to generate Instacart link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      alert('Failed to generate Instacart link');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Minimal Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00A862] mb-2">
            QuikCart
          </h1>
        </header>

        {/* Chat Window */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <ChatInput onListGenerated={handleListGenerated} />

          {/* Shopping List Display */}
          {shoppingList.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <ShoppingListDisplay 
                items={shoppingList} 
                onItemsChange={setShoppingList}
              />
            </div>
          )}

          {/* Preferences & Build Section */}
          {showPreferences && (
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div>
                <label htmlFor="zip-code" className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  id="zip-code"
                  type="text"
                  value={preferences.zipCode}
                  onChange={(e) => setPreferences({ ...preferences, zipCode: e.target.value })}
                  placeholder="Enter your ZIP code"
                  maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A862] focus:border-transparent outline-none transition-all"
                />
              </div>

              <button
                onClick={handleBuild}
                disabled={isProcessing || !preferences.zipCode || shoppingList.length === 0}
                className="w-full bg-[#00A862] hover:bg-[#009954] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {isProcessing ? 'Building Your Cart...' : 'Build Cart'}
              </button>
            </div>
          )}

          {/* Instacart Link */}
          {instacartLink && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <InstacartLink link={instacartLink} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
