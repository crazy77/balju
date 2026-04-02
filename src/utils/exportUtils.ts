import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CSVRow } from '../types';

/** Excel 시트 이름에 사용할 수 없는 문자 제거·길이 제한 */
export function sanitizeExcelSheetName(name: string): string {
  const cleaned = name.replace(/[\\/:*?[\]]/g, '_').trim() || 'Sheet';
  return cleaned.length > 31 ? cleaned.slice(0, 31) : cleaned;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 표시용 기본 파일명 (확장자 제거) */
export function baseNameFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || 'export';
}

export function exportRowsAsCsv(rows: CSVRow[], columns: string[]): Blob {
  const data = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const col of columns) {
      out[col] = row[col] ?? '';
    }
    return out;
  });
  const csv = Papa.unparse(data, { columns });
  return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
}

export function exportRowsAsXlsx(rows: CSVRow[], columns: string[], sheetName: string): Blob {
  const aoa: unknown[][] = [columns, ...rows.map((row) => columns.map((col) => row[col] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  const safeName = sanitizeExcelSheetName(sheetName);
  XLSX.utils.book_append_sheet(wb, ws, safeName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 카테고리별로 시트를 나눈 통합 엑셀 (분류 탭용)
 */
export function exportGroupedCategoriesAsXlsx(
  groupedData: Record<string, CSVRow[]>,
  sortedCategories: string[],
  columns: string[],
): Blob {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const cat of sortedCategories) {
    const rows = groupedData[cat];
    if (!rows?.length) continue;

    let sheetName = sanitizeExcelSheetName(cat);
    let suffix = 1;
    while (usedNames.has(sheetName)) {
      const extra = `_${suffix}`;
      const maxBase = 31 - extra.length;
      sheetName = `${sanitizeExcelSheetName(cat).slice(0, Math.max(1, maxBase))}${extra}`;
      suffix++;
    }
    usedNames.add(sheetName);

    const aoa: unknown[][] = [columns, ...rows.map((row) => columns.map((col) => row[col] ?? ''))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 모든 분류를 한 CSV로 내보냅니다. 맨 앞에 자체분류 컬럼을 두고(그룹 기준 값),
 * 기존 자체분류 컬럼은 한 번만 출력합니다.
 */
export function exportGroupedCategoriesAsCsv(
  groupedData: Record<string, CSVRow[]>,
  sortedCategories: string[],
  rowColumns: string[],
  categoryColumnKey: string,
): Blob {
  const restColumns = rowColumns.filter((h) => h !== categoryColumnKey);
  const columns = [categoryColumnKey, ...restColumns];
  const flat: CSVRow[] = [];

  for (const cat of sortedCategories) {
    const rows = groupedData[cat];
    if (!rows?.length) continue;
    for (const row of rows) {
      const out: CSVRow = { [categoryColumnKey]: cat };
      for (const col of restColumns) {
        out[col] = row[col] ?? '';
      }
      flat.push(out);
    }
  }

  return exportRowsAsCsv(flat, columns);
}
