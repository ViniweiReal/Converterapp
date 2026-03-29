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
        className={`glass-panel-dark hover-lift transition-all duration-300 border border-gray-200/50 p-8 text-center ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/50 shadow-inner-lg' 
            : 'hover:border-gray-400'
        }`}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full hover:bg-white/30 transition-colors duration-200">
            <svg className={`w-6 h-6 text-gray-600 ${isDragging ? 'text-blue-500 animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isDragging ? 'Release to add files' : 'Drag & drop multiple files'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: Images, Audio, Video, Documents
            </p>
            <label 
              htmlFor="batchFileInput" 
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover-lift press-effect"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
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
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total size: {formatBytes(totalSize)}
              </p>
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-red-500 hover:text-red-600 font-medium hover-lift transition-colors duration-200"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-3">
            {files.map((batchFile) => (
              <div
                key={batchFile.id}
                className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-inner-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                      {batchFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBytes(batchFile.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(batchFile.id)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors duration-200 hover-lift"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="batchFormatSelect" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Convert All To
              </label>
              <select
                id="batchFormatSelect"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-white/90 backdrop-blur-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                className="w-full flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-inner-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover-lift-lg press-effect disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConverting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Converting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Convert {files.length} File{files.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}