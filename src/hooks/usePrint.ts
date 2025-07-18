import type { HeaderNames } from '../types';
import { formatCellValue } from '../utils/csvUtils';

interface PrintConfig {
  title: string;
  headers: string[];
  data: any[];
  renderCellValue?: (row: any, header: string, index: number, allData: any[]) => string;
  groupedData?: Record<string, any[]>;
  headerNames?: HeaderNames;
  separateShipping?: Record<string, boolean>;
}

export const usePrint = () => {
  const createPrintStyles = () => `
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; margin-bottom: 20px; font-size: 20px; }
    h2 { margin-top: 30px; margin-bottom: 10px; padding: 10px; background-color: #f0f8ff; border-left: 4px solid #0066cc; font-size: 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 11px; margin-bottom: 30px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr.high-quantity { background-color: #fef3c7 !important; }
    tr.group-separator { border-top: 2px solid #666 !important; }
    @media print {
      body { margin: 0; }
      h2 { page-break-before: auto; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      tr.high-quantity { background-color: #fef3c7 !important; }
      tr.group-separator { border-top: 2px solid #666 !important; }
    }
  `;

  // 수량이 2개 이상인지 확인하는 함수
  const isQuantityTwoOrMore = (row: any, headerNames?: HeaderNames) => {
    if (!headerNames) return false;
    const quantity = row[headerNames.quantity];
    if (!quantity) return false;
    const numQuantity = Number.parseInt(quantity.toString().replace(/[^0-9]/g, ''), 10);
    return numQuantity >= 2;
  };

  // 새로운 그룹의 첫 번째 행인지 확인하는 함수
  const isFirstRowOfGroup = (
    row: any,
    index: number,
    categoryRows: any[],
    headerNames?: HeaderNames,
    separateShipping?: Record<string, boolean>,
  ) => {
    if (index === 0) return true; // 첫 번째 행은 항상 그룹의 시작
    if (!headerNames || !separateShipping) return false;

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

  const createTableHtml = (
    headers: string[],
    data: any[],
    renderCellValue?: (row: any, header: string, index: number, allData: any[]) => string,
    headerNames?: HeaderNames,
    separateShipping?: Record<string, boolean>,
  ) => `
    <table>
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data
          .map((row, index) => {
            const isHighQuantity = isQuantityTwoOrMore(row, headerNames);
            const isGroupStart = isFirstRowOfGroup(row, index, data, headerNames, separateShipping);

            let rowClass = '';
            if (isHighQuantity) rowClass += 'high-quantity ';
            if (isGroupStart && index > 0) rowClass += 'group-separator ';

            return `<tr class="${rowClass.trim()}">
            ${headers
              .map((header) => {
                const value = renderCellValue
                  ? renderCellValue(row, header, index, data)
                  : row[header] || '';
                return `<td>${formatCellValue(value, header)}</td>`;
              })
              .join('')}
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  `;

  const handlePrint = ({
    title,
    headers,
    data,
    renderCellValue,
    groupedData,
    headerNames,
    separateShipping,
  }: PrintConfig) => {
    const printWindow = window.open('', title);
    if (!printWindow) return;

    let htmlContent = '';

    if (groupedData) {
      // 분류별 프린트 (CategoryTab용)
      const sortedCategories = Object.keys(groupedData).sort((a, b) => {
        if (a === '직접배송') return 1;
        if (b === '직접배송') return -1;
        return a.localeCompare(b, 'ko');
      });

      htmlContent = sortedCategories
        .map((category) => {
          const categoryData = groupedData[category];
          return `
            <h2>${category} (${categoryData.length}개)</h2>
            ${createTableHtml(headers, categoryData, renderCellValue, headerNames, separateShipping)}
          `;
        })
        .join('');
    } else {
      // 단순 테이블 프린트 (OrderTab용)
      htmlContent = createTableHtml(headers, data, renderCellValue, headerNames, separateShipping);
    }

    const fullHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>${createPrintStyles()}</style>
        </head>
        <body>
          <h1>${title}</h1>
          ${htmlContent}
        </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return { handlePrint };
};
