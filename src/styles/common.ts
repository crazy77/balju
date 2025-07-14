// 레이아웃 관련 스타일
export const LAYOUT_STYLES = {
  container: 'p-4 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors',
  card: 'bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 overflow-hidden transition-colors',
  categoryHeader:
    'bg-blue-50 dark:bg-blue-900/30 px-4 py-2 border-b border-blue-100 dark:border-blue-800 transition-colors',
} as const;

// 테이블 관련 스타일
export const TABLE_STYLES = {
  container: 'overflow-x-auto',
  table: 'w-full text-xs',
  headerRow: 'bg-gray-50 dark:bg-gray-700 transition-colors',
  headerCell:
    'px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 transition-colors',
  bodyRow: 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
  bodyCell:
    'px-2 py-2 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
} as const;

// 버튼 관련 스타일
export const BUTTON_STYLES = {
  primary:
    'flex items-center px-3 py-1 text-xs bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors',
  secondary:
    'flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors',
  gray: 'px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors',
} as const;

// 텍스트 관련 스타일
export const TEXT_STYLES = {
  heading: 'text-lg font-bold text-gray-800 dark:text-white transition-colors',
  subheading: 'text-md font-semibold text-gray-800 dark:text-white transition-colors',
  description: 'text-sm text-gray-600 dark:text-gray-400 transition-colors',
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors',
} as const;

// 입력 요소 관련 스타일
export const INPUT_STYLES = {
  text: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors',
  checkbox:
    'w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors',
} as const;
