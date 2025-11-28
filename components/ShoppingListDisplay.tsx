'use client';

interface ShoppingListDisplayProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
}

export default function ShoppingListDisplay({ items, onItemsChange }: ShoppingListDisplayProps) {
  const handleRemove = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const newItem = prompt('Enter a new item:');
    if (newItem && newItem.trim()) {
      onItemsChange([...items, newItem.trim()]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Shopping List ({items.length})
        </h2>
        <button
          onClick={handleAdd}
          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
        >
          + Add Item
        </button>
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

