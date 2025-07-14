import type React from 'react';

interface EmptyDataViewProps {
  message?: string;
}

export const EmptyDataView: React.FC<EmptyDataViewProps> = ({ message = '데이터가 없습니다.' }) => {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm transition-colors">
        {message}
      </div>
    </div>
  );
};
