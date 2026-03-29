'use client';

import { useState, useRef, useEffect } from 'react';
import { convertFile, loadFFmpeg } from '@/utils/converter';
import { useStats } from '@/hooks/useStats';
import { StatsPanel } from '@/components/StatsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { BatchConverter } from '@/components/BatchConverter';
import { initializeUnityAds } from '@/lib/ads';
import { useHapticFeedback } from '@/hooks/useHaptic';
import { useTheme } from '@/components/ThemeProvider';

type Tab = 'convert' | 'batch' | 'history';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('convert');
  const [batchProgress, setBatchProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { stats, isLoaded, addConversion, clearHistory, deleteRecord } = useStats();
  const { triggerHaptic } = useHapticFeedback();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Initialize Unity Ads foundation
    initializeUnityAds();

    const load = async () => {
      try {
        setIsLoadingFFmpeg(true);
        await loadFFmpeg();
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
      } finally {
        setIsLoadingFFmpeg(false);
      }
    };
    load();
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      triggerHaptic('light');
      setSelectedFile(e.dataTransfer.files[0]);
      setConvertedFile(null);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerHaptic('light');
      setSelectedFile(e.target.files[0]);
      setConvertedFile(null);
      setError(null);
    }
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetFormat(e.target.value);
    setConvertedFile(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    if (!targetFormat) {
      setError('Please select a target format');
      return;
    }
    
    setIsConverting(true);
    setConversionProgress(0);
    setError(null);
    setConvertedFile(null);
    
    const startTime = Date.now();
    const sourceFormat = selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown';
    
    try {
      const blob = await convertFile(selectedFile, targetFormat, (progress) => {
        setConversionProgress(progress);
      });
      setConvertedFile(blob);
      
      const duration = Date.now() - startTime;
      addConversion(
        selectedFile.name,
        sourceFormat,
        targetFormat,
        selectedFile.size,
        duration
      );
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedFile) return;
    
    const url = window.URL.createObjectURL(convertedFile);
    const a = document.createElement('a');
    a.href = url;
    const originalName = selectedFile?.name.split('.')[0] || 'converted';
    a.download = `${originalName}.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setTargetFormat('');
    setConvertedFile(null);
    setConversionProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBatchConvert = async (files: File[], format: string) => {
    setIsConverting(true);
    setBatchProgress(0);
    let completed = 0;
    
    for (const file of files) {
      try {
        const startTime = Date.now();
        const sourceFormat = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        
        await convertFile(file, format, () => {});
        
        const duration = Date.now() - startTime;
        addConversion(file.name, sourceFormat, format, file.size, duration);
        
        completed++;
        setBatchProgress(Math.round((completed / files.length) * 100));
      } catch (err) {
        console.error(`Failed to convert ${file.name}:`, err);
      }
    }
    
    setIsConverting(false);
    setBatchProgress(0);
  };

  return (
    <main className="min-h-screen gradient-premium dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-premium mb-6 hover-lift transition-premium">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-premium-title mb-4">
            File Converter
          </h1>
          <p className="text-lg text-premium-subtitle max-w-xl mx-auto">
            Convert files between formats locally on your device. Fast, secure, and free.
          </p>
        </header>

        {/* Stats Panel */}
        {isLoaded && stats.totalConversions > 0 && (
          <StatsPanel stats={stats} />
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl mb-8 shadow-sm">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('convert');
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-300 haptic-touch ${
              activeTab === 'convert'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-lg hover-lift-lg press-effect'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Convert</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('batch');
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-300 haptic-touch ${
              activeTab === 'batch'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-lg hover-lift-lg press-effect'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Batch</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('history');
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-300 haptic-touch ${
              activeTab === 'history'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-lg hover-lift-lg press-effect'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
            {stats.recentConversions.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.recentConversions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'convert' && (
          <div className="glass-panel card-hover shadow-premium p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <form 
              onSubmit={handleSubmit}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="space-y-6"
            >
              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 hover-lift glass-panel-dark dark:border-gray-600/50 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-inner-lg'
                    : 'border-gray-300 hover:border-gray-400'
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
                        {isDragging ? 'Release to upload' : 'Drag & drop your file here'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Supported formats: Images, Audio, Video, Documents
                      </p>
                      <label 
                        htmlFor="fileInput" 
                        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover-lift press-effect"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Choose File
                      </label>
                      <input
                        type="file"
                        id="fileInput"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                </div>
                
                    {selectedFile && (
                      <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-inner-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-xs">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={resetConverter}
                            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors duration-200 hover-lift"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
              </div>
              
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label htmlFor="formatSelect" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                     Convert To
                   </label>
                   <select
                     id="formatSelect"
                     value={targetFormat}
                     onChange={handleFormatChange}
                     className="block w-full rounded-lg border-gray-300 bg-white/90 backdrop-blur-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                     disabled={isConverting || isLoadingFFmpeg}
                   >
                     <option value="">Select target format</option>
                     <optgroup label="Images">
                       <option value="jpg">JPG</option>
                       <option value="png">PNG</option>
                       <option value="webp">WebP</option>
                       <option value="gif">GIF</option>
                     </optgroup>
                     <optgroup label="Audio">
                       <option value="mp3">MP3</option>
                       <option value="wav">WAV</option>
                       <option value="ogg">OGG</option>
                     </optgroup>
                     <optgroup label="Video">
                       <option value="mp4">MP4</option>
                       <option value="webm">WebM</option>
                       <option value="ogg">OGG</option>
                     </optgroup>
                     <optgroup label="Documents">
                       <option value="pdf">PDF</option>
                       <option value="docx">DOCX</option>
                       <option value="txt">TXT</option>
                     </optgroup>
                   </select>
                 </div>
                 
                 <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={!selectedFile || !targetFormat || isConverting || isLoadingFFmpeg}
                    onClick={() => triggerHaptic('medium')}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-inner-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover-lift-lg press-effect haptic-touch disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isLoadingFFmpeg ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Loading...
                       </>
                     ) : isConverting ? (
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
                         Convert File
                       </>
                     )}
                   </button>
                 </div>
               </div>
              
               {conversionProgress > 0 && conversionProgress < 100 && (
                 <div className="space-y-3">
                   <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                     <div 
                       className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                       style={{ width: `${conversionProgress}%` }}
                     ></div>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-600 dark:text-gray-400">
                       Converting... {conversionProgress}%
                     </span>
                     <span className="font-medium text-gray-800 dark:text-gray-200">
                       {conversionProgress}%
                     </span>
                   </div>
                 </div>
               )}
            </form>
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="glass-panel card-hover shadow-premium p-6 sm:p-8">
            <h2 className="text-xl font-bold text-premium-title mb-6">Batch Convert</h2>
            
            {batchProgress > 0 && batchProgress < 100 && (
              <div className="mb-6 space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Processing... {batchProgress}%
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {batchProgress}%
                  </span>
                </div>
              </div>
            )}
            
            <BatchConverter 
              onConvert={handleBatchConvert} 
              isConverting={isConverting}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-panel card-hover shadow-premium p-6 sm:p-8">
            <HistoryPanel 
              records={stats.recentConversions}
              onDelete={deleteRecord}
              onClear={clearHistory}
            />
          </div>
        )}

        {/* Success Message */}
        {convertedFile && activeTab === 'convert' && (
          <div className="mt-8 glass-panel card-hover shadow-premium p-6 sm:p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4 shadow-inner-md">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-premium-title mb-2">
                Conversion Complete!
              </h2>
              <p className="text-lg text-premium-subtitle mb-6">
                Your file has been successfully converted.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    handleDownload();
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-inner-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 hover-lift-lg press-effect haptic-touch"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Converted File
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    resetConverter();
                  }}
                  className="flex-1 sm:flex-none mt-4 sm:mt-0 px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 font-medium rounded-xl shadow-lg hover:bg-white/80 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 hover-lift press-effect haptic-touch"
                >
                  Convert Another File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your files are processed locally. No data is uploaded to any server.</span>
          </div>
          <p className="text-xs text-gray-400">
            Install as an app for the best experience
          </p>
        </div>
      </div>
    </main>
  );
}