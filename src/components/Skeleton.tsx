import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div className={`skeleton-loading rounded-lg ${className}`} />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`skeleton-loading rounded-lg h-4 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export function FileCardSkeleton() {
  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 skeleton-loading rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-loading h-4 w-3/4 rounded" />
          <div className="skeleton-loading h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton-loading h-3 w-full rounded-full" />
      <div className="flex justify-between">
        <div className="skeleton-loading h-4 w-16 rounded" />
        <div className="skeleton-loading h-4 w-12 rounded" />
      </div>
    </div>
  );
}