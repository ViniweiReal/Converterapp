'use client';

import { useState, useRef } from 'react';

interface BatchFile {
  file: File;
  id: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  error?: string;
}

interface BatchConverterProps {
  onConvert: (files: File[], targetFormat: string) => Promise<void>;
  isConverting: boolean;
}

export function BatchConverter({ onConvert, isConverting }: BatchConverterProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const batchFiles: BatchFile[] = newFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...batchFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setTargetFormat('');
  };

  const handleConvert = async () => {
    if (files.length === 0 || !targetFormat) return;
    
    const fileArray = files.map(f => f.file);
    await onConvert(fileArray, targetFormat);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
            <svg className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {isDragging ? 'Release to add files' : 'Drag & drop multiple files'}
            </p>
            <label 
              htmlFor="batchFileInput" 
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
            >
              Browse Files
            </label>
            <input
              type="file"
              id="batchFileInput"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-500">
                Total size: {formatBytes(totalSize)}
              </p>
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((batchFile) => (
              <div
                key={batchFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                      {batchFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(batchFile.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(batchFile.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="batchFormatSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Convert All To
              </label>
              <select
                id="batchFormatSelect"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">Select format</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleConvert}
                disabled={files.length === 0 || !targetFormat || isConverting}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isConverting ? 'Converting...' : `Convert ${files.length} File${files.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}