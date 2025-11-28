'use client';

import { useState } from 'react';
import InputSelector from '@/components/InputSelector';
import PreferencesPanel from '@/components/PreferencesPanel';
import ShoppingListDisplay from '@/components/ShoppingListDisplay';
import InstacartLink from '@/components/InstacartLink';

export default function Home() {
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    store: '',
    zipCode: '',
  });
  const [instacartLink, setInstacartLink] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleListGenerated = (items: string[]) => {
    setShoppingList(items);
  };

  const handleGenerateLink = async () => {
    if (shoppingList.length === 0) {
      alert('Please add items to your shopping list first');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
            QuikCart
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Transform your shopping list into an Instacart cart
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input Methods */}
          <div className="lg:col-span-2 space-y-6">
            <InputSelector onListGenerated={handleListGenerated} />
            
            {shoppingList.length > 0 && (
              <ShoppingListDisplay 
                items={shoppingList} 
                onItemsChange={setShoppingList}
              />
            )}
          </div>

          {/* Right Column - Preferences & Link */}
          <div className="space-y-6">
            <PreferencesPanel 
              preferences={preferences}
              onPreferencesChange={setPreferences}
            />

            {shoppingList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <button
                  onClick={handleGenerateLink}
                  disabled={isProcessing || !preferences.zipCode}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  {isProcessing ? 'Generating Link...' : 'Generate Instacart Link'}
                </button>
                {!preferences.zipCode && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Please enter your ZIP code to generate a link
                  </p>
                )}
              </div>
            )}

            {instacartLink && (
              <InstacartLink link={instacartLink} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

