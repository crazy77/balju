import { useAtom } from 'jotai';
import { Printer } from 'lucide-react';
import type React from 'react';
import { Toaster } from 'react-hot-toast';
import { useCellCopy, usePrint } from '../hooks';
import { headerNamesAtom, processedCSVDataAtom, visibleColumnsAtom } from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TABLE_STYLES } from '../styles/common';
import { addSimpleSerialNumbers, formatCellValue, parseQuantity } from '../utils/csvUtils';
import { EmptyDataView, TabHeader } from './common';

export const OrderTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const { handleCellClick, isRowSelected } = useCellCopy();
  const { handlePrint } = usePrint();

  if (!processedData || processedData.length === 0) {
    return <EmptyDataView />;
  }

  const dataWithSerialNumbers = addSimpleSerialNumbers(processedData);
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

  const onPrint = () => {
    handlePrint({
      title: '발주서',
      headers,
      data: dataWithSerialNumbers,
      headerNames,
    });
  };

  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="발주서" subTitle={`${dataWithSerialNumbers.length}건`}>
        <button onClick={onPrint} className={BUTTON_STYLES.primary} title="프린트">
          <Printer className="h-3 w-3 mr-1" />
          프린트
        </button>
      </TabHeader>

      <div className={LAYOUT_STYLES.card}>
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
              {dataWithSerialNumbers.map((row, index) => {
                const isHighQuantity = isQuantityTwoOrMore(row);
                const isSelected = isRowSelected(index);

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
                          onClick={() => handleCellClick(row[header] || '', header, index)}
                        >
                          {formatCellValue(row[header] || '', header)}
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
      <Toaster position="top-right" />
    </div>
  );
};
