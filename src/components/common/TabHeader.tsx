import type React from 'react';

interface TabHeaderProps {
  title: string;
  children?: React.ReactNode;
  subTitle?: string;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, children, subTitle }) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-end gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">
          {title}
        </h2>
        {subTitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{subTitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
};
