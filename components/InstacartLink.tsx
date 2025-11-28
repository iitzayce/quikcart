'use client';

interface InstacartLinkProps {
  link: string;
}

export default function InstacartLink({ link }: InstacartLinkProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Your Instacart Link
      </h2>
      
      <div className="space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 break-all">
            {link}
          </p>
        </div>

        <div className="flex gap-3">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200"
          >
            Open in Instacart
          </a>
          <button
            onClick={handleCopy}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            title="Copy link"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Click the link to go to Instacart, select your store, and your cart will be populated!
        </p>
      </div>
    </div>
  );
}

