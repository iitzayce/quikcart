'use client';

import { useState } from 'react';

interface ShoppingListDisplayProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
}

export default function ShoppingListDisplay({ items, onItemsChange }: ShoppingListDisplayProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleRemove = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const newItem = prompt('Enter a new item:');
    if (newItem && newItem.trim()) {
      onItemsChange([...items, newItem.trim()]);
    }
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        onItemsChange(data.items);
      }
    } catch (error) {
      console.error('Error enhancing list:', error);
      alert('Failed to enhance list. Using original items.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Shopping List ({items.length})
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Enhance list with AI to normalize and improve item names"
          >
            {isEnhancing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enhancing...
              </>
            ) : (
              <>
                ✨ Enhance with AI
              </>
            )}
          </button>
          <button
            onClick={handleAdd}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
          >
            + Add Item
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No items in your list yet
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-gray-900 dark:text-white flex-1">{item}</span>
              <button
                onClick={() => handleRemove(index)}
                className="text-red-500 hover:text-red-600 ml-3"
                aria-label={`Remove ${item}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

