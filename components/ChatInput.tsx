'use client';

import { useState, useRef } from 'react';

interface ChatInputProps {
  onListGenerated: (items: string[]) => void;
}

export default function ChatInput({ onListGenerated }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imagePreview) {
      // Process image
      handleImageSubmit();
    } else if (audioBlob) {
      // Process audio
      handleAudioSubmit();
    } else if (text.trim()) {
      // Process text
      handleTextSubmit();
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        onListGenerated(data.items);
        setText('');
        resetAll();
      }
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!imagePreview || !fileInputRef.current?.files?.[0]) return;
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        onListGenerated(data.items);
        resetAll();
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        onListGenerated(data.items);
        resetAll();
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setText('');
        setAudioBlob(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setText('');
        setImagePreview(null);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetAll = () => {
    setText('');
    setImagePreview(null);
    setAudioBlob(null);
    setIsRecording(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview area */}
      {(imagePreview || audioBlob) && (
        <div className="relative rounded-lg overflow-hidden bg-gray-50 p-4">
          {imagePreview && (
            <>
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
              <button
                type="button"
                onClick={resetAll}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          {audioBlob && (
            <>
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
              <button
                type="button"
                onClick={resetAll}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="relative flex items-end gap-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setImagePreview(null);
            setAudioBlob(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type your shopping list..."
          className="flex-1 resize-none border-none outline-none text-gray-900 placeholder-gray-400 text-sm min-h-[60px] max-h-32 py-2 px-2"
          rows={3}
          disabled={isProcessing || isRecording || !!imagePreview || !!audioBlob}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isRecording || !!audioBlob}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload image"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Microphone button */}
          <button
            type="button"
            onClick={handleMicrophoneClick}
            disabled={isProcessing || !!imagePreview}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'bg-red-100 hover:bg-red-200' 
                : 'hover:bg-gray-100'
            }`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg 
              className={`w-5 h-5 ${isRecording ? 'text-red-600' : 'text-gray-600'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isRecording ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          {/* Build button */}
          <button
            type="submit"
            disabled={isProcessing || (!text.trim() && !imagePreview && !audioBlob)}
            className="px-6 py-2 bg-[#00A862] hover:bg-[#009954] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Build'}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </form>
  );
}

