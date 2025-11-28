'use client';

import { useState } from 'react';
import TextInput from './input-methods/TextInput';
import ImageInput from './input-methods/ImageInput';
import AudioInput from './input-methods/AudioInput';

type InputMethod = 'text' | 'image' | 'audio';

interface InputSelectorProps {
  onListGenerated: (items: string[]) => void;
}

export default function InputSelector({ onListGenerated }: InputSelectorProps) {
  const [activeMethod, setActiveMethod] = useState<InputMethod>('text');

  const tabs = [
    { id: 'text' as InputMethod, label: '📝 Text', icon: '📝' },
    { id: 'image' as InputMethod, label: '🖼️ Image', icon: '🖼️' },
    { id: 'audio' as InputMethod, label: '🎤 Voice', icon: '🎤' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMethod(tab.id)}
              className={`
                flex-1 py-4 px-6 text-center font-medium transition-colors duration-200
                ${
                  activeMethod === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label.split(' ')[1]}
            </button>
          ))}
        </nav>
      </div>

      {/* Input Content */}
      <div className="p-6">
        {activeMethod === 'text' && <TextInput onListGenerated={onListGenerated} />}
        {activeMethod === 'image' && <ImageInput onListGenerated={onListGenerated} />}
        {activeMethod === 'audio' && <AudioInput onListGenerated={onListGenerated} />}
      </div>
    </div>
  );
}

