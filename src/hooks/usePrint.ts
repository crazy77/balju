import { formatCellValue } from '../utils/csvUtils';

interface PrintConfig {
  title: string;
  headers: string[];
  data: any[];
  renderCellValue?: (row: any, header: string, index: number, allData: any[]) => string;
  groupedData?: Record<string, any[]>;
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
    @media print {
      body { margin: 0; }
      h2 { page-break-before: auto; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  `;

  const createTableHtml = (
    headers: string[],
    data: any[],
    renderCellValue?: (row: any, header: string, index: number, allData: any[]) => string,
  ) => `
    <table>
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (row, index) =>
              `<tr>
            ${headers
              .map((header) => {
                const value = renderCellValue
                  ? renderCellValue(row, header, index, data)
                  : row[header] || '';
                return `<td>${formatCellValue(value, header)}</td>`;
              })
              .join('')}
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `;

  const handlePrint = ({ title, headers, data, renderCellValue, groupedData }: PrintConfig) => {
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
            ${createTableHtml(headers, categoryData, renderCellValue)}
          `;
        })
        .join('');
    } else {
      // 단순 테이블 프린트 (OrderTab용)
      htmlContent = createTableHtml(headers, data, renderCellValue);
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
