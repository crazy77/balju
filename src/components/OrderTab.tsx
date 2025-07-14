import { useAtom } from 'jotai';
import { Printer } from 'lucide-react';
import type React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { processedCSVDataAtom, visibleColumnsAtom } from '../stores/csvStore';
import { addSimpleSerialNumbers, formatCellValue } from '../utils/csvUtils';

export const OrderTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [visibleColumns] = useAtom(visibleColumnsAtom);

  if (!processedData || processedData.length === 0) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
        <div className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm transition-colors">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  const dataWithSerialNumbers = addSimpleSerialNumbers(processedData);
  const allDataHeaders = Object.keys(processedData[0]);

  // 선택된 컬럼만 필터링 (기본값은 모든 컬럼 표시)
  const visibleDataHeaders = allDataHeaders.filter((header) =>
    visibleColumns[header] !== undefined ? visibleColumns[header] : true,
  );

  const headers = ['No.', ...visibleDataHeaders];

  // 셀 클릭 시 값 복사
  const handleCellClick = (value: string, columnName: string) => {
    if (!value) return;

    // 포맷팅된 값을 복사
    const formattedValue = formatCellValue(value, columnName);

    navigator.clipboard
      .writeText(formattedValue)
      .then(() => {
        toast.success(
          `복사되었습니다: ${formattedValue.length > 20 ? `${formattedValue.substring(0, 20)}...` : formattedValue}`,
        );
      })
      .catch(() => {
        toast.error('복사에 실패했습니다.');
      });
  };

  // 프린트 기능
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHtml = `
      <html>
        <head>
          <title>발주서</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; font-size: 20px; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>발주서</h1>
          <table>
            <thead>
              <tr>
                ${headers.map((header) => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${dataWithSerialNumbers
                .map(
                  (row) =>
                    `<tr>
                  ${headers
                    .map((header) => `<td>${formatCellValue(row[header] || '', header)}</td>`)
                    .join('')}
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">
          발주서
        </h2>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1 text-xs bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          title="프린트"
        >
          <Printer className="h-3 w-3 mr-1" />
          프린트
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 transition-colors">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataWithSerialNumbers.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-2 py-2 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
