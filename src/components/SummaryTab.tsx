import { useAtom } from 'jotai';
import { ChevronDown, ChevronUp, Expand, Minimize } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { processedCSVDataAtom, headerNamesAtom } from '../stores/csvStore';
import { calculateSummary, formatAmount } from '../utils/csvUtils';

export const SummaryTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
        <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm transition-colors">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  const summary = calculateSummary(
    processedData, 
    headerNames.category, 
    headerNames.productName, 
    headerNames.quantity, 
    headerNames.price
  );
  const totalQuantity = summary.reduce((sum, category) => sum + category.totalQuantity, 0);
  const totalPrice = summary.reduce((sum, category) => sum + category.totalPrice, 0);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleExpandAll = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);
    const newExpandedState: Record<string, boolean> = {};
    summary.forEach(category => {
      newExpandedState[category.category] = newExpandAll;
    });
    setExpandedCategories(newExpandedState);
  };

  const isCategoryExpanded = (category: string) => {
    return expandedCategories[category] || false;
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">요약</h2>
        <button
          onClick={toggleExpandAll}
          className="flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
        >
          {expandAll ? (
            <>
              <Minimize className="h-3 w-3 mr-1" />
              모두 접기
            </>
          ) : (
            <>
              <Expand className="h-3 w-3 mr-1" />
              모두 펼치기
            </>
          )}
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 transition-colors">
          <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-2 transition-colors">전체 요약</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors">총 수량:</span>
              <span className="ml-2 font-medium text-gray-800 dark:text-white transition-colors">{totalQuantity}개</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors">총 금액:</span>
              <span className="ml-2 font-medium text-gray-800 dark:text-white transition-colors">{formatAmount(totalPrice)}원</span>
            </div>
          </div>
        </div>

        {summary.map((categoryData) => (
          <div key={categoryData.category} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 transition-colors">
            <div 
              className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b border-blue-100 dark:border-blue-800 cursor-pointer flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              onClick={() => toggleCategory(categoryData.category)}
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white transition-colors">
                  {categoryData.category}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors">
                  총 {categoryData.totalQuantity}개 • {formatAmount(categoryData.totalPrice)}원
                </p>
              </div>
              <div className="text-blue-600 dark:text-blue-400 transition-colors">
                {isCategoryExpanded(categoryData.category) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>

            {isCategoryExpanded(categoryData.category) && (
              <div className="p-4">
                <div className="space-y-2">
                  {categoryData.items.map((item) => (
                    <div key={item.productName} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors">
                      <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors">{item.productName}</span>
                      <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                        {item.quantity}개 • {formatAmount(item.price)}원
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
