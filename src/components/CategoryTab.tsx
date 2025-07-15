import { useAtom } from 'jotai';
import { Copy, Printer } from 'lucide-react';
import type React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useCategoryCopy, useCellCopy, usePrint } from '../hooks';
import { headerNamesAtom, processedCSVDataAtom, visibleColumnsAtom } from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TABLE_STYLES, TEXT_STYLES } from '../styles/common';
import {
  formatCellValue,
  groupByCategoryWithAddressSorting,
  parseQuantity,
  sortCategories,
} from '../utils/csvUtils';
import { EmptyDataView, TabHeader } from './common';

export const CategoryTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);
  const { handleCellClick, isRowSelected } = useCellCopy();
  const { handlePrint } = usePrint();
  const { handleCategoryCopy } = useCategoryCopy();

  if (!processedData || processedData.length === 0) {
    return <EmptyDataView />;
  }

  const groupedData = groupByCategoryWithAddressSorting(
    processedData,
    headerNames.category,
    headerNames.address,
  );
  const sortedCategories = sortCategories(Object.keys(groupedData));
  const allDataHeaders = Object.keys(processedData[0]);

  // 선택된 컬럼만 필터링 (기본값은 모든 컬럼 표시)
  const visibleDataHeaders = allDataHeaders.filter((header) =>
    visibleColumns[header] !== undefined ? visibleColumns[header] : true,
  );

  const headers = ['No.', ...visibleDataHeaders];

  // 수량이 2개 이상인지 확인하는 함수
  const isQuantityTwoOrMore = (row: any) => {
    const quantity = row[headerNames.quantity];
    if (!quantity) return false;
    const numQuantity = parseQuantity(quantity);
    return numQuantity >= 2;
  };

  // 같은 주소 그룹에서 첫 번째 행에만 일련번호를 표시하는 함수
  const renderCellValue = (row: any, header: string, index: number, categoryRows: any[]) => {
    if (header === 'No.') {
      // 현재 행의 주소와 일련번호
      const currentAddress = row[headerNames.address] || '주소 없음';
      const currentSerialNo = row['No.'];

      // 이전 행이 있는지 확인
      if (index > 0) {
        const prevRow = categoryRows[index - 1];
        const prevAddress = prevRow[headerNames.address] || '주소 없음';
        const prevSerialNo = prevRow['No.'];

        // 이전 행과 같은 주소이고 같은 일련번호면 빈 셀 표시
        if (currentAddress === prevAddress && currentSerialNo === prevSerialNo) {
          return '';
        }
      }

      // 첫 번째 행이거나 다른 주소 그룹의 첫 번째 행이면 일련번호 표시
      return currentSerialNo || '';
    }
    return row[header] || '';
  };

  // 카테고리별 직접배송이 아닌 항목 개수 계산
  const getNonDirectShippingCount = (categoryData: any[]) => {
    return categoryData.filter((row) => row[headerNames.category] !== '직접배송').length;
  };

  const onPrint = () => {
    // 직접배송 분류만 필터링
    const directShippingData = groupedData['직접배송'];

    if (!directShippingData || directShippingData.length === 0) {
      toast.error('직접배송 데이터가 없습니다.');
      return;
    }

    const filteredGroupedData = { 직접배송: directShippingData };

    handlePrint({
      title: '직접배송 발주서',
      headers,
      data: [],
      groupedData: filteredGroupedData,
      renderCellValue,
      headerNames,
    });
  };

  const onCategoryCopy = (categoryData: any[]) => {
    handleCategoryCopy(categoryData);
  };

  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="분류">
        <button onClick={onPrint} className={BUTTON_STYLES.primary} title="프린트">
          <Printer className="h-3 w-3 mr-1" />
          프린트
        </button>
      </TabHeader>

      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const categoryData = groupedData[category];
          const nonDirectShippingCount = getNonDirectShippingCount(categoryData);
          const hasNonDirectShipping = nonDirectShippingCount > 0;

          return (
            <div key={category} className={LAYOUT_STYLES.card}>
              <div
                className={cn(LAYOUT_STYLES.categoryHeader, 'flex items-center justify-between')}
              >
                <h3 className={TEXT_STYLES.subheading}>
                  {category}{' '}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({categoryData.length}건 •
                    {
                      categoryData.filter(
                        (row, index, self) =>
                          index ===
                          self.findIndex(
                            (t) => t[headerNames.address] === row[headerNames.address],
                          ),
                      ).length
                    }
                    개 배송지)
                  </span>
                </h3>
                {hasNonDirectShipping && (
                  <button
                    onClick={() => onCategoryCopy(categoryData)}
                    className={`${BUTTON_STYLES.secondary} ml-2`}
                    title="직접배송이 아닌 항목 복사"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    복사 ({nonDirectShippingCount}건)
                  </button>
                )}
              </div>

              <div className={TABLE_STYLES.container}>
                <table className={TABLE_STYLES.table}>
                  <thead>
                    <tr className={TABLE_STYLES.headerRow}>
                      {headers.map((header) => (
                        <th key={header} className={TABLE_STYLES.headerCell}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((row, index) => {
                      const rowKey = `${category}-${index}`;
                      const isHighQuantity = isQuantityTwoOrMore(row);
                      const isSelected = isRowSelected(rowKey);

                      // 수량이 2개 이상인 경우 다른 배경색 적용
                      let rowClassName = TABLE_STYLES.bodyRow;
                      if (isSelected) {
                        rowClassName +=
                          ' bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600';
                      } else if (isHighQuantity) {
                        rowClassName +=
                          ' bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
                      }

                      return (
                        <tr key={index} className={rowClassName}>
                          {headers.map((header) => {
                            let cellClassName = TABLE_STYLES.bodyCell;
                            if (isSelected) {
                              cellClassName += ' bg-blue-50 dark:bg-blue-900/20';
                            } else if (isHighQuantity) {
                              cellClassName += ' bg-amber-50 dark:bg-amber-900/10';
                            }
                            cellClassName +=
                              ' cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';

                            return (
                              <td
                                key={header}
                                className={cellClassName}
                                onClick={() =>
                                  handleCellClick(
                                    renderCellValue(row, header, index, categoryData),
                                    header,
                                    rowKey,
                                  )
                                }
                              >
                                {formatCellValue(
                                  renderCellValue(row, header, index, categoryData),
                                  header,
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      <Toaster position="top-right" />
    </div>
  );
};
