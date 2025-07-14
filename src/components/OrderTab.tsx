import { useAtom } from 'jotai';
import { Printer } from 'lucide-react';
import type React from 'react';
import { Toaster } from 'react-hot-toast';
import { useCellCopy, usePrint } from '../hooks';
import { processedCSVDataAtom, visibleColumnsAtom } from '../stores/csvStore';
import { BUTTON_STYLES, LAYOUT_STYLES, TABLE_STYLES } from '../styles/common';
import { addSimpleSerialNumbers, formatCellValue } from '../utils/csvUtils';
import { EmptyDataView, TabHeader } from './common';

export const OrderTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);
  const { handleCellClick } = useCellCopy();
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

  const onPrint = () => {
    handlePrint({
      title: '발주서',
      headers,
      data: dataWithSerialNumbers,
    });
  };

  return (
    <div className={LAYOUT_STYLES.container}>
      <TabHeader title="발주서">
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
              {dataWithSerialNumbers.map((row, index) => (
                <tr key={index} className={TABLE_STYLES.bodyRow}>
                  {headers.map((header) => (
                    <td
                      key={header}
                      className={TABLE_STYLES.bodyCell}
                      onClick={() => handleCellClick(row[header] || '', header)}
                    >
                      {formatCellValue(row[header] || '', header)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};
