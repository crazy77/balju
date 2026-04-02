import { useAtom } from 'jotai';
import { Copy, Download, FileSpreadsheet, Printer } from 'lucide-react';
import type React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useCategoryCopy, useCellCopy, usePrint } from '../hooks';
import {
  currentCSVDataAtom,
  headerNamesAtom,
  processedCSVDataAtom,
  separateShippingAtom,
  visibleColumnsAtom,
} from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TABLE_STYLES, TEXT_STYLES } from '../styles/common';
import {
  formatCellValue,
  groupByCategoryWithOrderNumberAndSeparateShipping,
  parseQuantity,
  sortCategories,
} from '../utils/csvUtils';
import {
  baseNameFromFileName,
  downloadBlob,
  exportGroupedCategoriesAsCsv,
  exportGroupedCategoriesAsXlsx,
} from '../utils/exportUtils';
import { EmptyDataView, TabHeader } from './common';

export const CategoryTab: React.FC = () => {
  const [currentCSVData] = useAtom(currentCSVDataAtom);
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);
  const [separateShipping] = useAtom(separateShippingAtom);
  const { handleCellClick, isRowSelected } = useCellCopy();
  const { handlePrint } = usePrint();
  const { handleCategoryCopy } = useCategoryCopy();

  if (!processedData || processedData.length === 0) {
    return <EmptyDataView />;
  }

  const groupedData = groupByCategoryWithOrderNumberAndSeparateShipping(
    processedData,
    headerNames.category,
    headerNames.orderNumber,
    headerNames.productName,
    separateShipping,
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

  // 새로운 그룹의 첫 번째 행인지 확인하는 함수
  const isFirstRowOfGroup = (row: any, index: number, categoryRows: any[]) => {
    if (index === 0) return true; // 첫 번째 행은 항상 그룹의 시작

    const currentOrderNumber = row[headerNames.orderNumber] || '주문번호 없음';
    const currentProductName = row[headerNames.productName] || '';
    const currentSeparateShipping = separateShipping[currentProductName] || false;

    const prevRow = categoryRows[index - 1];
    const prevOrderNumber = prevRow[headerNames.orderNumber] || '주문번호 없음';
    const prevProductName = prevRow[headerNames.productName] || '';
    const prevSeparateShipping = separateShipping[prevProductName] || false;

    // 주문번호가 다르면 새로운 그룹
    if (currentOrderNumber !== prevOrderNumber) return true;

    // 별도 배송 설정이 다르면 새로운 그룹
    if (currentSeparateShipping !== prevSeparateShipping) return true;

    // 둘 다 별도 배송인 경우, 상품명이 다르면 새로운 그룹
    if (currentSeparateShipping && prevSeparateShipping && currentProductName !== prevProductName) {
      return true;
    }

    return false;
  };

  // 같은 그룹에서 첫 번째 행에만 일련번호를 표시하는 함수
  const renderCellValue = (row: any, header: string, index: number, categoryRows: any[]) => {
    if (header === 'No.') {
      // 현재 행의 주문번호, 상품명, 별도배송여부, 일련번호
      const currentOrderNumber = row[headerNames.orderNumber] || '주문번호 없음';
      const currentProductName = row[headerNames.productName] || '';
      const currentSeparateShipping = separateShipping[currentProductName] || false;
      const currentSerialNo = row['No.'];

      // 이전 행이 있는지 확인
      if (index > 0) {
        const prevRow = categoryRows[index - 1];
        const prevOrderNumber = prevRow[headerNames.orderNumber] || '주문번호 없음';
        const prevProductName = prevRow[headerNames.productName] || '';
        const prevSeparateShipping = separateShipping[prevProductName] || false;
        const prevSerialNo = prevRow['No.'];

        // 같은 그룹인지 확인
        let isSameGroup =
          currentOrderNumber === prevOrderNumber &&
          currentSeparateShipping === prevSeparateShipping &&
          currentSerialNo === prevSerialNo;

        // 둘 다 별도 배송인 경우, 상품명도 같아야 같은 그룹
        if (currentSeparateShipping && prevSeparateShipping) {
          isSameGroup = isSameGroup && currentProductName === prevProductName;
        }

        if (isSameGroup) {
          return '';
        }
      }

      // 첫 번째 행이거나 다른 그룹의 첫 번째 행이면 일련번호 표시
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
      separateShipping,
    });
  };

  const onExportCsv = () => {
    const blob = exportGroupedCategoriesAsCsv(
      groupedData,
      sortedCategories,
      headers,
      headerNames.category,
    );
    const base = baseNameFromFileName(currentCSVData?.name ?? '분류');
    downloadBlob(blob, `${base}_분류별.csv`);
    toast.success('CSV 파일을 저장했습니다.');
  };

  const onExportXlsx = () => {
    const blob = exportGroupedCategoriesAsXlsx(groupedData, sortedCategories, headers);
    const base = baseNameFromFileName(currentCSVData?.name ?? '분류');
    downloadBlob(blob, `${base}_분류별.xlsx`);
    toast.success('Excel 파일을 저장했습니다.');
  };

  const onCategoryCopy = (categoryData: any[]) => {
    handleCategoryCopy(categoryData);
  };

  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="분류">
        <button type="button" onClick={onExportCsv} className={BUTTON_STYLES.secondary} title="CSV">
          <Download className="h-3 w-3 mr-1" />
          CSV
        </button>
        <button
          type="button"
          onClick={onExportXlsx}
          className={BUTTON_STYLES.secondary}
          title="Excel"
        >
          <FileSpreadsheet className="h-3 w-3 mr-1" />
          Excel
        </button>
        <button type="button" onClick={onPrint} className={BUTTON_STYLES.primary} title="프린트">
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
                            (t) => t[headerNames.orderNumber] === row[headerNames.orderNumber],
                          ),
                      ).length
                    }
                    개 주문)
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
                      const isGroupStart = isFirstRowOfGroup(row, index, categoryData);

                      // 수량이 2개 이상인 경우 다른 배경색 적용
                      let rowClassName = TABLE_STYLES.bodyRow;
                      if (isSelected) {
                        rowClassName +=
                          ' bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600';
                      } else if (isHighQuantity) {
                        rowClassName +=
                          ' bg-red-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
                      }

                      // 새로운 그룹의 첫 번째 행에 상단 구분선 추가
                      if (isGroupStart && index > 0) {
                        rowClassName += ' border-t-2 border-gray-400 dark:border-gray-500';
                      }

                      return (
                        <tr key={index} className={rowClassName}>
                          {headers.map((header) => {
                            let cellClassName = TABLE_STYLES.bodyCell;
                            if (isSelected) {
                              cellClassName += ' bg-blue-50 dark:bg-blue-900/20';
                            } else if (isHighQuantity) {
                              cellClassName += ' bg-red-200 dark:bg-red-800/10';
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
