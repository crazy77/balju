import { useAtom } from 'jotai';
import { Printer } from 'lucide-react';
import type React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { headerNamesAtom, processedCSVDataAtom, visibleColumnsAtom } from '../stores/csvStore';
import {
  formatCellValue,
  groupByCategoryWithAddressSorting,
  sortCategories,
} from '../utils/csvUtils';

export const CategoryTab: React.FC = () => {
  const [processedData] = useAtom(processedCSVDataAtom);
  const [headerNames] = useAtom(headerNamesAtom);
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
          <title>분류별 발주서</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; font-size: 20px; }
            h2 { margin-top: 30px; margin-bottom: 10px; padding: 10px; background-color: #f0f8ff; border-left: 4px solid #0066cc; font-size: 16px; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              h2 { page-break-before: auto; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>분류별 발주서</h1>
          ${sortedCategories
            .map((category) => {
              const categoryData = groupedData[category];
              return `
              <h2>${category} (${categoryData.length}개)</h2>
              <table>
                <thead>
                  <tr>
                    ${headers.map((header) => `<th>${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${categoryData
                    .map(
                      (row) =>
                        `<tr>
                      ${headers
                        .map((header) => {
                          const value = renderCellValue(
                            row,
                            header,
                            categoryData.indexOf(row),
                            categoryData,
                          );
                          return `<td>${formatCellValue(value, header)}</td>`;
                        })
                        .join('')}
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            `;
            })
            .join('')}
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
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

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">분류</h2>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-1 text-xs bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          title="프린트"
        >
          <Printer className="h-3 w-3 mr-1" />
          프린트
        </button>
      </div>

      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const categoryData = groupedData[category];
          return (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden transition-colors"
            >
              <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b border-blue-100 dark:border-blue-800 transition-colors">
                <h3 className="text-md font-semibold text-gray-800 dark:text-white transition-colors">
                  {category} ({categoryData.length}개)
                </h3>
              </div>

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
                    {categoryData.map((row, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {headers.map((header) => (
                          <td
                            key={header}
                            className="px-2 py-2 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
