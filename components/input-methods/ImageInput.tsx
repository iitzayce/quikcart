'use client';

import { useState, useRef } from 'react';

interface ImageInputProps {
  onListGenerated: (items: string[]) => void;
}

export default function ImageInput({ onListGenerated }: ImageInputProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        onListGenerated(data.items);
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        alert(data.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Upload an image of your shopping list
      </label>
      
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-gray-600 dark:text-gray-400">
              Click to upload or drag and drop
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Shopping list preview"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
              disabled={isProcessing}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isProcessing ? 'Processing Image...' : 'Extract Shopping List'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

