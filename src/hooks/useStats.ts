import { useState, useEffect, useCallback } from 'react';

export interface ConversionRecord {
  id: string;
  fileName: string;
  sourceFormat: string;
  targetFormat: string;
  fileSize: number;
  timestamp: number;
  duration: number;
}

export interface Stats {
  totalConversions: number;
  totalFilesProcessed: number;
  totalSizeProcessed: number;
  conversionsByFormat: Record<string, number>;
  conversionsByType: Record<string, number>;
  recentConversions: ConversionRecord[];
}

const STORAGE_KEY = 'file-converter-stats';
const HISTORY_LIMIT = 50;

const defaultStats: Stats = {
  totalConversions: 0,
  totalFilesProcessed: 0,
  totalSizeProcessed: 0,
  conversionsByFormat: {},
  conversionsByType: {},
  recentConversions: [],
};

export function useStats() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStats(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveStats = useCallback((newStats: Stats) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    } catch (err) {
      console.error('Failed to save stats:', err);
    }
  }, []);

  const addConversion = useCallback((
    fileName: string,
    sourceFormat: string,
    targetFormat: string,
    fileSize: number,
    duration: number
  ) => {
    setStats(prev => {
      const record: ConversionRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        sourceFormat,
        targetFormat,
        fileSize,
        timestamp: Date.now(),
        duration,
      };

      const newStats: Stats = {
        totalConversions: prev.totalConversions + 1,
        totalFilesProcessed: prev.totalFilesProcessed + 1,
        totalSizeProcessed: prev.totalSizeProcessed + fileSize,
        conversionsByFormat: {
          ...prev.conversionsByFormat,
          [targetFormat]: (prev.conversionsByFormat[targetFormat] || 0) + 1,
        },
        conversionsByType: {
          ...prev.conversionsByType,
          [sourceFormat]: (prev.conversionsByType[sourceFormat] || 0) + 1,
        },
        recentConversions: [record, ...prev.recentConversions].slice(0, HISTORY_LIMIT),
      };

      saveStats(newStats);
      return newStats;
    });
  }, [saveStats]);

  const clearHistory = useCallback(() => {
    setStats(defaultStats);
    saveStats(defaultStats);
  }, [saveStats]);

  const deleteRecord = useCallback((id: string) => {
    setStats(prev => {
      const newStats: Stats = {
        ...prev,
        recentConversions: prev.recentConversions.filter(r => r.id !== id),
      };
      saveStats(newStats);
      return newStats;
    });
  }, [saveStats]);

  return {
    stats,
    isLoaded,
    addConversion,
    clearHistory,
    deleteRecord,
  };
}