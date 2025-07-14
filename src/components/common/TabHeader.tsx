import type React from 'react';

interface TabHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, children }) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">{title}</h2>
      {children}
    </div>
  );
};
