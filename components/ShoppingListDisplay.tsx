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
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </h2>
        <button
          onClick={handleAdd}
          className="text-[#00A862] hover:text-[#009954] font-medium text-sm"
        >
          + Add
        </button>
      </div>

      {items.length === 0 ? null : (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-900 text-sm flex-1">{item}</span>
              <button
                onClick={() => handleRemove(index)}
                className="text-gray-400 hover:text-red-500 ml-2 p-1"
                aria-label={`Remove ${item}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

