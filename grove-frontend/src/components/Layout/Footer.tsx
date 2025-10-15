import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white/60 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-4 text-sm text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-700">Made by</span>
          <span className="font-medium">Jeesu Jung, Jongun Kim</span>
        </div>
        <div className="text-gray-400">© {new Date().getFullYear()} WEAVE</div>
      </div>
    </footer>
  );
};


