'use client';

import { ConversionRecord } from '@/hooks/useStats';

interface HistoryPanelProps {
  records: ConversionRecord[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}

function getFileIcon(format: string): string {
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
  const audioFormats = ['mp3', 'wav', 'ogg', 'm4a'];
  const videoFormats = ['mp4', 'webm', 'avi', 'mov'];
  
  if (imageFormats.includes(format)) return '🖼️';
  if (audioFormats.includes(format)) return '🎵';
  if (videoFormats.includes(format)) return '🎬';
  if (format === 'pdf') return '📄';
  if (format === 'docx') return '📝';
  return '📁';
}

export function HistoryPanel({ records, onDelete, onClear }: HistoryPanelProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversion history</h3>
        <p className="text-gray-500">Your converted files will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Conversions ({records.length})
        </h3>
        <button
          onClick={onClear}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(record.targetFormat)}</div>
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-[200px]">
                    {record.fileName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.sourceFormat.toUpperCase()} → {record.targetFormat.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-gray-900">
                    {formatBytes(record.fileSize)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(record.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}