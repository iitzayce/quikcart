'use client';

import { useState } from 'react';

interface TextInputProps {
  onListGenerated: (items: string[]) => void;
}

export default function TextInput({ onListGenerated }: TextInputProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        onListGenerated(data.items);
        setText('');
      } else {
        alert(data.error || 'Failed to process text');
      }
    } catch (error) {
      console.error('Error processing text:', error);
      alert('Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Enter your shopping list
      </label>
      <form onSubmit={handleSubmit}>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g., Milk, Bread, Eggs, Chicken breast, Spinach..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          rows={6}
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={isProcessing || !text.trim()}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isProcessing ? 'Processing...' : 'Process List'}
        </button>
      </form>
    </div>
  );
}

