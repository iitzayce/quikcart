'use client';

interface PreferencesPanelProps {
  preferences: {
    store: string;
    zipCode: string;
  };
  onPreferencesChange: (preferences: { store: string; zipCode: string }) => void;
}

export default function PreferencesPanel({ preferences, onPreferencesChange }: PreferencesPanelProps) {
  const handleChange = (field: 'store' | 'zipCode', value: string) => {
    onPreferencesChange({
      ...preferences,
      [field]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Preferences
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="zip-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ZIP Code *
          </label>
          <input
            id="zip-code"
            type="text"
            value={preferences.zipCode}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            placeholder="e.g., 94102"
            maxLength={5}
            pattern="[0-9]{5}"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 mt-1">
            Required to find available stores
          </p>
        </div>

        <div>
          <label htmlFor="store" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preferred Store (Optional)
          </label>
          <input
            id="store"
            type="text"
            value={preferences.store}
            onChange={(e) => handleChange('store', e.target.value)}
            placeholder="e.g., Safeway, Whole Foods"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 mt-1">
            Helps prioritize store selection
          </p>
        </div>
      </div>
    </div>
  );
}

