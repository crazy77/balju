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

// 카테고리별로 그룹핑하고 각 카테고리 내에서 주문번호별로 정렬하는 함수
export const groupByCategoryWithOrderNumberSorting = (
  data: CSVRow[],
  categoryColumn: string,
  orderNumberColumn: string,
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

  // 2단계: 각 카테고리 내에서 주문번호별로 그룹핑하고 정렬
  const result: Record<string, CSVRow[]> = {};

  Object.entries(categoryGroups).forEach(([category, rows]) => {
    // 주문번호별로 그룹핑
    const orderNumberGroups: Record<string, CSVRow[]> = {};

    rows.forEach((row) => {
      const orderNumber = row[orderNumberColumn] || '주문번호 없음';
      if (!orderNumberGroups[orderNumber]) {
        orderNumberGroups[orderNumber] = [];
      }
      orderNumberGroups[orderNumber].push(row);
    });

    // 주문번호 순으로 정렬
    const sortedOrderNumberGroups = Object.entries(orderNumberGroups).sort(([orderA], [orderB]) =>
      orderA.localeCompare(orderB, 'ko'),
    );

    // 정렬된 데이터에 일련번호 추가
    const categoryResult: CSVRow[] = [];
    let serialNo = 1;

    sortedOrderNumberGroups.forEach(([_orderNumber, orderRows]) => {
      // 같은 주문번호 그룹의 모든 행에 같은 일련번호 부여
      orderRows.forEach((row) => {
        categoryResult.push({
          ...row,
          'No.': serialNo.toString(),
        });
      });

      // 다음 주문번호 그룹으로 넘어갈 때 일련번호 증가
      serialNo++;
    });

    result[category] = categoryResult;
  });

  return result;
};

// 카테고리별로 그룹핑하고 각 카테고리 내에서 주문번호와 별도 배송 여부를 고려하여 정렬하는 함수
export const groupByCategoryWithOrderNumberAndSeparateShipping = (
  data: CSVRow[],
  categoryColumn: string,
  orderNumberColumn: string,
  productNameColumn: string,
  separateShippingSettings: Record<string, boolean>,
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

  // 2단계: 각 카테고리 내에서 주문번호와 별도 배송 여부로 그룹핑하고 정렬
  const result: Record<string, CSVRow[]> = {};

  Object.entries(categoryGroups).forEach(([category, rows]) => {
    // 주문번호 + 별도배송 여부로 그룹핑
    const orderGroups: Record<string, CSVRow[]> = {};

    rows.forEach((row) => {
      const orderNumber = row[orderNumberColumn] || '주문번호 없음';
      const productName = row[productNameColumn] || '';
      const isSeparateShipping = separateShippingSettings[productName] || false;

      // 그룹 키: 별도 배송인 경우 상품명도 포함하여 각각 다른 그룹으로 분리
      const groupKey = isSeparateShipping
        ? `${orderNumber}_true_${productName}`
        : `${orderNumber}_false`;

      if (!orderGroups[groupKey]) {
        orderGroups[groupKey] = [];
      }
      orderGroups[groupKey].push(row);
    });

    // 주문번호 순, 같은 주문번호 내에서는 일반 배송 → 별도 배송 순으로 정렬
    const sortedOrderGroups = Object.entries(orderGroups).sort(([keyA], [keyB]) => {
      const partsA = keyA.split('_');
      const partsB = keyB.split('_');

      const orderA = partsA[0];
      const orderB = partsB[0];

      // 주문번호 순으로 먼저 정렬
      const orderCompare = orderA.localeCompare(orderB, 'ko');
      if (orderCompare !== 0) return orderCompare;

      // 같은 주문번호면 일반 배송(false) → 별도 배송(true) 순
      const separateA = partsA[1] === 'true';
      const separateB = partsB[1] === 'true';

      if (separateA !== separateB) {
        return separateA ? 1 : -1; // false가 먼저, true가 나중
      }

      // 둘 다 별도 배송인 경우 상품명 순으로 정렬
      if (separateA && separateB) {
        const productA = partsA[2] || '';
        const productB = partsB[2] || '';
        return productA.localeCompare(productB, 'ko');
      }

      return 0;
    });

    // 정렬된 데이터에 일련번호 추가
    const categoryResult: CSVRow[] = [];
    let serialNo = 1;

    sortedOrderGroups.forEach(([_groupKey, orderRows]) => {
      // 같은 그룹의 모든 행에 같은 일련번호 부여
      orderRows.forEach((row) => {
        categoryResult.push({
          ...row,
          'No.': serialNo.toString(),
        });
      });

      // 다음 그룹으로 넘어갈 때 일련번호 증가
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

// 금액 문자열을 숫자로 변환하는 함수 (콤마 제거)
export const parsePrice = (priceString: string): number => {
  if (!priceString) return 0;

  // 콤마, 공백, 원화 기호 등을 제거하고 숫자만 추출
  const cleanedPrice = priceString.toString().replace(/[^\d.-]/g, '');
  const parsedPrice = Number.parseFloat(cleanedPrice);

  return Number.isNaN(parsedPrice) ? 0 : parsedPrice;
};

// 수량 문자열을 숫자로 변환하는 함수 (콤마 제거)
export const parseQuantity = (quantityString: string): number => {
  if (!quantityString) return 0;

  // 콤마, 공백, "개" 등을 제거하고 숫자만 추출
  const cleanedQuantity = quantityString.toString().replace(/[^\d.-]/g, '');
  const parsedQuantity = Number.parseInt(cleanedQuantity);

  return Number.isNaN(parsedQuantity) ? 0 : parsedQuantity;
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
      const quantity = parseQuantity(row[quantityColumn] || '0');
      const price = parsePrice(row[priceColumn] || '0');

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

// 분류별 판매액 데이터를 차트용으로 변환하는 함수
export const getCategorySalesData = (
  data: CSVRow[],
  categoryColumn: string,
  priceColumn: string,
  quantityColumn: string,
  isQuantity = false,
): Array<{ name: string; value: number }> => {
  const grouped = groupByCategory(data, categoryColumn);

  return Object.entries(grouped)
    .map(([category, rows]) => {
      const totalPrice = rows.reduce((sum, row) => {
        const price = parsePrice(row[priceColumn] || '0');
        const quantity = parseQuantity(row[quantityColumn] || '0');
        return sum + (isQuantity ? quantity : price);
      }, 0);

      return {
        name: category,
        value: totalPrice,
      };
    })
    .sort((a, b) => b.value - a.value); // 판매액 내림차순 정렬
};

// 수령인별 판매액 데이터를 차트용으로 변환하는 함수
export const getRecipientSalesData = (
  data: CSVRow[],
  addressColumn: string,
  recipientColumn: string,
  priceColumn: string,
  categoryColumn: string,
  quantityColumn: string,
  limit = 10,
  isDirect = false,
  isQuantity = false,
): Array<{ name: string; value: number }> => {
  const recipientGroups: Record<string, number> = {};

  for (const row of data) {
    const category = row[categoryColumn];
    const isRecipientDirect = category !== '직접배송';
    if (isDirect && isRecipientDirect) continue;
    const address = row[addressColumn] || '주소 없음';
    const recipient = (isRecipientDirect ? category : row[recipientColumn]) ?? '수령인 없음';
    const price = parsePrice(row[priceColumn] || '0');
    const quantity = parseQuantity(row[quantityColumn] || '0');

    // 수령인 이름과 주소 앞 5자리를 조합하여 키 생성
    const addressPrefix = address.length > 5 ? address.substring(0, 5) : address;
    const displayName = isRecipientDirect ? recipient : `${recipient} (${addressPrefix})`;

    if (!recipientGroups[displayName]) {
      recipientGroups[displayName] = 0;
    }
    if (isQuantity) {
      recipientGroups[displayName] += quantity;
    } else {
      recipientGroups[displayName] += price;
    }
  }

  return Object.entries(recipientGroups)
    .map(([displayName, totalPrice]) => ({
      name: displayName.length > 20 ? `${displayName.substring(0, 17)}...` : displayName,
      value: totalPrice,
    }))
    .sort((a, b) => b.value - a.value) // 판매액 내림차순 정렬
    .slice(0, limit); // 상위 N개만 표시
};
