'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioInputProps {
  onListGenerated: (items: string[]) => void;
}

export default function AudioInput({ onListGenerated }: AudioInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [audioUrl]);

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
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
      } else {
        alert(data.error || 'Failed to process audio');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        Record your shopping list
      </label>

      {!audioUrl ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold
                transition-all duration-200 shadow-lg
                ${isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
                }
              `}
            >
              {isRecording ? (
                <div className="w-8 h-8 bg-white rounded"></div>
              ) : (
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>
              )}
            </button>
          </div>
          {isRecording && (
            <div className="text-red-600 font-semibold">
              Recording: {formatTime(recordingTime)}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRecording 
              ? 'Click the button again to stop recording' 
              : 'Click the microphone to start recording your shopping list'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <audio src={audioUrl} controls className="w-full" />
          </div>
          <div className="flex gap-2">
            <form onSubmit={handleSubmit} className="flex-1">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isProcessing ? 'Processing Audio...' : 'Process Shopping List'}
              </button>
            </form>
            <button
              onClick={handleRetry}
              disabled={isProcessing}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

