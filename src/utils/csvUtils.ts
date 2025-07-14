import Papa from 'papaparse';
import type { CategorySummary, CSVRow, ProductSummary } from '../types';

export const parseCSV = (file: File): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          // 필드 불일치 오류는 경고로만 처리하고 데이터 파싱은 계속 진행
          const hasFieldMismatchOnly = results.errors.every(
            (error: any) =>
              error.type === 'FieldMismatch' ||
              error.code === 'TooFewFields' ||
              error.code === 'TooManyFields',
          );

          if (hasFieldMismatchOnly) {
            console.warn('CSV 파싱 경고 (무시됨):', results.errors);
            resolve(results.data as CSVRow[]);
          } else {
            console.warn('CSV 파싱 오류:', results.errors);
            reject(results.errors);
          }
        } else {
          resolve(results.data as CSVRow[]);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const getUniqueProductNames = (data: CSVRow[], productNameColumn: string): string[] => {
  const uniqueNames: string[] = [];
  const seen = new Set<string>();

  data.forEach((row) => {
    const productName = row[productNameColumn];
    if (productName?.trim() && !seen.has(productName.trim())) {
      uniqueNames.push(productName.trim());
      seen.add(productName.trim());
    }
  });

  return uniqueNames;
};

export const applyProductNameMappings = (
  data: CSVRow[],
  mappings: Record<string, string>,
  productNameColumn: string,
): CSVRow[] => {
  return data.map((row) => {
    const originalName = row[productNameColumn];
    const mappedName =
      originalName && mappings[originalName] ? mappings[originalName] : originalName;

    return {
      ...row,
      [productNameColumn]: mappedName,
    };
  });
};

// 발주서용 단순 일련번호 추가
export const addSimpleSerialNumbers = (data: CSVRow[]): CSVRow[] => {
  return data.map((row, index) => ({
    ...row,
    'No.': (index + 1).toString(),
  }));
};

export const groupByCategory = (
  data: CSVRow[],
  categoryColumn: string,
): Record<string, CSVRow[]> => {
  const grouped: Record<string, CSVRow[]> = {};

  data.forEach((row) => {
    const category = row[categoryColumn] || '기타';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(row);
  });

  return grouped;
};

// 카테고리별로 그룹핑하고 각 카테고리 내에서 주소별로 정렬하는 함수
export const groupByCategoryWithAddressSorting = (
  data: CSVRow[],
  categoryColumn: string,
  addressColumn: string,
): Record<string, CSVRow[]> => {
  // 1단계: 카테고리별로 그룹핑
  const categoryGroups: Record<string, CSVRow[]> = {};

  data.forEach((row) => {
    const category = row[categoryColumn] || '기타';
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(row);
  });

  // 2단계: 각 카테고리 내에서 주소별로 그룹핑하고 정렬
  const result: Record<string, CSVRow[]> = {};

  Object.entries(categoryGroups).forEach(([category, rows]) => {
    // 주소별로 그룹핑
    const addressGroups: Record<string, CSVRow[]> = {};

    rows.forEach((row) => {
      const address = row[addressColumn] || '주소 없음';
      if (!addressGroups[address]) {
        addressGroups[address] = [];
      }
      addressGroups[address].push(row);
    });

    // 주소 그룹을 크기별로 정렬 (작은 그룹부터)
    const sortedAddressGroups = Object.entries(addressGroups).sort(
      ([, rowsA], [, rowsB]) => rowsA.length - rowsB.length,
    );

    // 정렬된 데이터에 일련번호 추가
    const categoryResult: CSVRow[] = [];
    let serialNo = 1;

    sortedAddressGroups.forEach(([_address, addressRows]) => {
      // 같은 주소 그룹의 모든 행에 같은 일련번호 부여
      addressRows.forEach((row) => {
        categoryResult.push({
          ...row,
          'No.': serialNo.toString(),
        });
      });

      // 다음 주소 그룹으로 넘어갈 때 일련번호 증가
      serialNo++;
    });

    result[category] = categoryResult;
  });

  return result;
};

export const sortCategories = (categories: string[]): string[] => {
  return categories.sort((a, b) => {
    // 직접배송을 맨 마지막으로
    if (a === '직접배송') return 1;
    if (b === '직접배송') return -1;
    return a.localeCompare(b, 'ko');
  });
};

export const calculateSummary = (
  data: CSVRow[],
  categoryColumn: string,
  productNameColumn: string,
  quantityColumn: string,
  priceColumn: string,
): CategorySummary[] => {
  const grouped = groupByCategory(data, categoryColumn);
  const categories = sortCategories(Object.keys(grouped));

  return categories.map((category) => {
    const categoryData = grouped[category];
    const productSummaries: Record<string, ProductSummary> = {};

    categoryData.forEach((row) => {
      const productName = row[productNameColumn] || '알 수 없음';
      const quantity = Number.parseInt(row[quantityColumn] || '0');
      const price = Number.parseFloat(row[priceColumn] || '0');

      if (!productSummaries[productName]) {
        productSummaries[productName] = {
          productName,
          quantity: 0,
          price: 0,
        };
      }

      productSummaries[productName].quantity += quantity;
      productSummaries[productName].price += price;
    });

    const items = Object.values(productSummaries).sort((a, b) =>
      a.productName.localeCompare(b.productName, 'ko'),
    );

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    return {
      category,
      totalQuantity,
      totalPrice,
      items,
    };
  });
};

// 금액 관련 컬럼명인지 확인하는 함수
export const isAmountColumn = (columnName: string): boolean => {
  const amountKeywords = ['가격', '금액', '판매가', '단가', '총액', '합계', '원'];
  return amountKeywords.some((keyword) => columnName.includes(keyword));
};

// 숫자 문자열을 금액 형식으로 포맷팅하는 함수
export const formatAmount = (value: string | number): string => {
  if (!value) return '';

  // 숫자로 변환 가능한지 확인
  const numValue =
    typeof value === 'string' ? Number.parseFloat(value.replace(/[^\d.-]/g, '')) : value;

  if (Number.isNaN(numValue)) return value.toString();

  // 정수인 경우 소수점 없이 포맷팅
  if (Number.isInteger(numValue)) {
    return Math.round(numValue).toLocaleString('ko-KR');
  }

  return numValue.toLocaleString('ko-KR');
};

// 셀 값을 적절한 형식으로 포맷팅하는 함수
export const formatCellValue = (value: string, columnName: string): string => {
  if (!value) return '';

  if (isAmountColumn(columnName)) {
    return formatAmount(value);
  }

  return value;
};
