import { useAtom } from 'jotai';
import { Printer } from 'lucide-react';
import type React from 'react';
import { Toaster } from 'react-hot-toast';
import { useCellCopy, usePrint } from '../hooks';
import { headerNamesAtom, processedCSVDataAtom, visibleColumnsAtom } from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TABLE_STYLES, TEXT_STYLES } from '../styles/common';
import {
  formatCellValue,
  groupByCategoryWithAddressSorting,
  sortCategories,
} from '../utils/csvUtils';
import { EmptyDataView, TabHeader } from './common';

export const CategoryTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);
  const { handleCellClick } = useCellCopy();
  const { handlePrint } = usePrint();

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

  const onPrint = () => {
    handlePrint({
      title: '분류별 발주서',
      headers,
      data: [],
      groupedData,
      renderCellValue,
    });
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
          return (
            <div key={category} className={LAYOUT_STYLES.card}>
              <div className={LAYOUT_STYLES.categoryHeader}>
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
                    {categoryData.map((row, index) => (
                      <tr key={index} className={TABLE_STYLES.bodyRow}>
                        {headers.map((header) => (
                          <td
                            key={header}
                            className={TABLE_STYLES.bodyCell}
                            onClick={() =>
                              handleCellClick(
                                renderCellValue(row, header, index, categoryData),
                                header,
                              )
                            }
                          >
                            {formatCellValue(
                              renderCellValue(row, header, index, categoryData),
                              header,
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
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
