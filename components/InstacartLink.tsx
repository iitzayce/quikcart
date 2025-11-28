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
    <div className="space-y-4">
      <div className="bg-[#00A862]/10 border border-[#00A862]/20 rounded-xl p-4">
        <p className="text-xs text-gray-600 break-all">
          {link}
        </p>
      </div>

      <div className="flex gap-3">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#00A862] hover:bg-[#009954] text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors"
        >
          Open in Instacart
        </a>
        <button
          onClick={handleCopy}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
          title="Copy link"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

