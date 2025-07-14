import { useAtom } from 'jotai';
import { ChevronDown, ChevronUp, Expand, Minimize } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { headerNamesAtom, processedCSVDataAtom } from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TEXT_STYLES } from '../styles/common';
import {
  calculateSummary,
  formatAmount,
  getCategorySalesData,
  getRecipientSalesData,
} from '../utils/csvUtils';
import { EmptyDataView, TabHeader } from './common';

export const SummaryTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  if (!processedData || processedData.length === 0) {
    return <EmptyDataView />;
  }

  const summary = calculateSummary(
    processedData,
    headerNames.category,
    headerNames.productName,
    headerNames.quantity,
    headerNames.price,
  );
  const totalQuantity = summary.reduce((sum, category) => sum + category.totalQuantity, 0);
  const totalPrice = summary.reduce((sum, category) => sum + category.totalPrice, 0);

  // 차트 데이터 생성
  const categorySalesData = getCategorySalesData(
    processedData,
    headerNames.category,
    headerNames.price,
  );
  const recipientSalesData = getRecipientSalesData(
    processedData,
    headerNames.address,
    headerNames.recipient,
    headerNames.price,
    20,
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleExpandAll = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);
    const newExpandedState: Record<string, boolean> = {};
    summary.forEach((category) => {
      newExpandedState[category.category] = newExpandAll;
    });
    setExpandedCategories(newExpandedState);
  };

  const isCategoryExpanded = (category: string) => {
    return expandedCategories[category] || false;
  };

  // 차트 툴팁 커스텀 포맷터
  const formatTooltip = (value: number) => {
    return [`${formatAmount(value)}원`, '판매액'];
  };

  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="요약">
        <button onClick={toggleExpandAll} className={BUTTON_STYLES.secondary}>
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
      </TabHeader>

      <div className="space-y-3">
        <div className={LAYOUT_STYLES.card}>
          <div className="p-4">
            <h3 className={`${TEXT_STYLES.subheading} mb-2`}>전체 요약</h3>
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className={TEXT_STYLES.description}>총 수량:</span>
                <span
                  className={`ml-2 font-medium ${TEXT_STYLES.subheading.replace('text-md', 'text-sm')}`}
                >
                  {totalQuantity}개
                </span>
              </div>
              <div>
                <span className={TEXT_STYLES.description}>총 금액:</span>
                <span
                  className={`ml-2 font-bold ${TEXT_STYLES.subheading.replace('text-lg', 'text-base')}`}
                >
                  {formatAmount(totalPrice)}원
                </span>
              </div>
            </div>
          </div>
        </div>

        {summary.map((categoryData) => (
          <div key={categoryData.category} className={LAYOUT_STYLES.card}>
            <button
              type="button"
              className={`${LAYOUT_STYLES.categoryHeader} w-full flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors`}
              onClick={() => toggleCategory(categoryData.category)}
            >
              <div className="text-left flex items-center gap-2">
                <h3
                  className={`min-w-16 text-base font-semibold ${TEXT_STYLES.heading.replace('text-lg', 'text-sm')}`}
                >
                  {categoryData.category}
                </h3>
                <p className={`text-xs ${TEXT_STYLES.description}`}>
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
            </button>

            {isCategoryExpanded(categoryData.category) && (
              <div className="p-4">
                <div className="space-y-2">
                  {categoryData.items.map((item) => (
                    <div
                      key={item.productName}
                      className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      <span
                        className={`text-sm ${TEXT_STYLES.description.replace('text-gray-600 dark:text-gray-400', 'text-gray-700 dark:text-gray-300')}`}
                      >
                        {item.productName}
                      </span>
                      <div className="grid grid-cols-2 min-w-44 items-center text-right gap-2">
                        <span className={`text-xs ${TEXT_STYLES.description}`}>
                          {item.quantity}개
                        </span>
                        <span className={`text-sm ${TEXT_STYLES.description}`}>
                          {formatAmount(item.price)}원{' '}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 분류별 판매액 막대그래프 */}
        <div className={LAYOUT_STYLES.card}>
          <div className="p-4">
            <h3 className={`${TEXT_STYLES.subheading} mb-4`}>분류별 판매액</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={categorySalesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis tickFormatter={(value) => formatAmount(value)} />
                  <Tooltip
                    formatter={formatTooltip}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 수령인별 판매액 막대그래프 */}
        <div className={LAYOUT_STYLES.card}>
          <div className="p-4">
            <h3 className={`${TEXT_STYLES.subheading} mb-4`}>수령인별 판매액 (상위 20개)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={recipientSalesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => formatAmount(value)} />
                  <Tooltip
                    formatter={formatTooltip}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
