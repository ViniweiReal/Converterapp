'use client';

import { useState, useRef, useEffect } from 'react';
import { convertFile, loadFFmpeg } from '@/utils/converter';
import { useStats } from '@/hooks/useStats';
import { initializeUnityAds } from '@/lib/ads';
import { useHapticFeedback } from '@/hooks/useHaptic';
import { getAccentClasses, getCardRotation, generateDecorativeElements, ACCENT_COLORS } from '@/lib/formatx';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { stats, isLoaded } = useStats();
  const { triggerHaptic } = useHapticFeedback();
  const decorativeElements = generateDecorativeElements();

  useEffect(() => {
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

  const handleFormatChange = (e: any) => {
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

    try {
      const blob = await convertFile(selectedFile, targetFormat, (progress) => {
        setConversionProgress(progress);
      });
      setConvertedFile(blob);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedFile || !selectedFile) return;

    const url = window.URL.createObjectURL(convertedFile);
    const a = document.createElement('a');
    a.href = url;
    const originalName = selectedFile.name.split('.')[0] || 'converted';
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

  return (
    <main className="cosmic-bg relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 dot-grid" />
      <div className="absolute inset-0 diagonal-stripes" />
      <div className="absolute inset-0 gradient-mesh" />

      {/* Massive Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-9xl md:text-[14rem] font-black font-outfit uppercase tracking-tighter opacity-[0.08] text-shadow-triple">
          CONVERT
        </h1>
      </div>

      {/* Floating Decorative Elements */}
      {decorativeElements.map((element) => (
        <div
          key={element.id}
          className={`decorative-element ${element.animation === 'spin' ? 'spin' : ''}`}
          style={{
            top: element.position.top,
            left: element.position.left,
            fontSize: `${element.size}px`,
            animationDelay: `${Math.random() * 4}s`,
          }}
          aria-hidden="true"
        >
          {element.symbol}
        </div>
      ))}

      <div className="relative z-10 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-magenta rounded-3xl shadow-stacked mb-8 animate-pulse-glow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>

          <h1 className="text-6xl md:text-8xl font-black font-outfit uppercase tracking-tighter text-shadow-triple gradient-text-animated mb-6">
            FormatX
          </h1>

          <p className="text-xl md:text-2xl font-dm-sans text-muted max-w-2xl mx-auto leading-relaxed">
            Convert files between formats entirely on-device.
            <span className="block mt-2 font-medium">Fast, secure, and completely free.</span>
          </p>
        </header>

        {/* Format Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            { title: 'Images', formats: ['JPG', 'PNG', 'WEBP', 'HEIC'], icon: '🖼️' },
            { title: 'Documents', formats: ['PDF', 'DOCX', 'TXT'], icon: '📄' },
            { title: 'Audio', formats: ['MP3', 'WAV', 'AAC', 'FLAC'], icon: '🎵' },
            { title: 'Video', formats: ['MP4', 'MOV', 'AVI'], icon: '🎬' },
            { title: 'Archives', formats: ['ZIP', 'RAR', '7Z'], icon: '📦' },
            { title: 'More', formats: ['CSV', 'JSON', 'XML'], icon: '⚡' },
          ].map((category, index) => {
            const accentClasses = getAccentClasses(index);
            const offsetClass = index % 2 === 1 ? 'md:translate-y-8' : '';

            return (
              <div
                key={category.title}
                className={`${accentClasses.card} ${getCardRotation(index)} ${offsetClass} p-6 hover:shadow-stacked-hover transition-all duration-300 cursor-pointer group`}
                onClick={() => triggerHaptic('light')}
              >
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className={`text-2xl font-bold font-outfit uppercase tracking-tight ${accentClasses.text} mb-3`}>
                    {category.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.formats.map((format) => (
                      <span
                        key={format}
                        className="px-2 py-1 bg-white/20 rounded text-xs font-medium text-white border border-white/30"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Converter Interface */}
        <div className="formatx-card border-magenta shadow-stacked p-8 md:p-12">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="space-y-8">
            <div className={`file-drop-zone border-cyan relative p-12 text-center transition-all duration-300 ${isDragging ? 'drag-active' : ''}`}>
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-cyan rounded-full animate-bounce-subtle">
                  <svg className={`w-8 h-8 text-white ${isDragging ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold font-outfit uppercase tracking-wide text-white mb-3">
                    {isDragging ? 'Release to upload' : 'Drop your file here'}
                  </p>
                  <p className="text-sm text-muted mb-6">
                    Images • Documents • Audio • Video • Archives
                  </p>
                  <label htmlFor="fileInput" className="btn-secondary border-accent-magenta text-white px-8 py-4 text-lg font-bold font-outfit uppercase tracking-widest">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Browse Files
                  </label>
                  <input type="file" id="fileInput" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              {selectedFile && (
                <div className="mt-8 p-6 muted-container rounded-2xl border-4 border-orange shadow-stacked">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-accent-yellow rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold font-outfit text-white truncate max-w-sm">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { triggerHaptic('light'); resetConverter(); }} className="p-3 text-white hover:bg-white/20 rounded-xl transition-colors duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold font-outfit uppercase tracking-wide text-white mb-6">Choose Output Format</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { format: 'JPG', category: 'Images' },
                  { format: 'PNG', category: 'Images' },
                  { format: 'PDF', category: 'Documents' },
                  { format: 'MP3', category: 'Audio' },
                  { format: 'MP4', category: 'Video' },
                  { format: 'DOCX', category: 'Documents' },
                  { format: 'WAV', category: 'Audio' },
                  { format: 'WEBP', category: 'Images' },
                ].map((item, index) => {
                  const isSelected = targetFormat === item.format.toLowerCase();
                  const accentClasses = getAccentClasses(index);

                  return (
                    <button
                      key={item.format}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        handleFormatChange({ target: { value: item.format.toLowerCase() } });
                      }}
                      className={`p-4 rounded-2xl border-4 text-center transition-all duration-300 hover:scale-105 ${
                        isSelected
                          ? `${accentClasses.card} shadow-stacked scale-105`
                          : 'muted-container border-accent-purple hover:border-accent-magenta'
                      }`}
                    >
                      <div className={`text-2xl font-black font-outfit uppercase tracking-tight mb-1 ${
                        isSelected ? accentClasses.text : 'text-white'
                      }`}>
                        {item.format}
                      </div>
                      <div className={`text-xs font-medium uppercase tracking-wide ${
                        isSelected ? 'text-white' : 'text-muted'
                      }`}>
                        {item.category}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Convert Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={!selectedFile || !targetFormat || isConverting || isLoadingFFmpeg}
                  onClick={() => triggerHaptic('heavy')}
                  className="btn-primary px-12 py-6 text-2xl h-16 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoadingFFmpeg ? 'Loading...' : isConverting ? 'Converting...' : (
                    <>
                      <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Convert File
                    </>
                  )}
                </button>
              </div>
            </div>

            {conversionProgress > 0 && conversionProgress < 100 && (
              <div className="space-y-3">
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent-magenta to-accent-cyan h-3 rounded-full transition-all duration-300"
                    style={{ width: `${conversionProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    Converting... {conversionProgress}%
                  </span>
                  <span className="font-medium text-white">
                    {conversionProgress}%
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Success Screen */}
        {convertedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center cosmic-bg">
            {/* Background Patterns */}
            <div className="absolute inset-0 dot-grid" />
            <div className="absolute inset-0 diagonal-stripes" />
            <div className="absolute inset-0 gradient-mesh" />

            {/* Confetti Burst */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti-burst"
                style={{
                  backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length].value,
                  left: `${20 + (i * 3)}%`,
                  top: `${20 + (i * 2)}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}

            <div className="relative z-10 text-center max-w-md mx-auto p-8">
              <div className="mb-8">
                <h1 className="text-9xl font-bangers text-shadow-triple gradient-text-animated mb-4">
                  DONE!
                </h1>
                <p className="text-xl text-muted font-dm-sans">
                  Your file has been converted successfully
                </p>
              </div>

              <div className="muted-container rounded-3xl p-6 border-4 border-purple shadow-stacked mb-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-accent-magenta rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold font-outfit text-white">
                      {selectedFile?.name.replace(/\.[^/.]+$/, '')}.{targetFormat}
                    </p>
                    <p className="text-sm text-muted">
                      Ready for download
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button onClick={() => { triggerHaptic('heavy'); handleDownload(); }} className="btn-primary w-full py-4 text-xl h-14">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download File
                </button>

                <button onClick={() => { triggerHaptic('light'); resetConverter(); }} className="btn-secondary w-full py-4 text-xl h-14 border-accent-cyan">
                  Convert Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center space-y-4">
          <div className="inline-flex items-center space-x-4 text-sm text-muted">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-dm-sans">Your files are processed locally. No data is uploaded to any server.</span>
          </div>
          <p className="text-xs text-muted font-dm-sans">
            Install as an app for the best experience
          </p>
        </div>
      </div>
    </main>
  );
}