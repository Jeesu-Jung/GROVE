import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description }) => {
  return (
    <div
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};