import { useAtom } from 'jotai';
import { BarChart3, FileText, Home, Layers, Settings } from 'lucide-react';
import type React from 'react';
import { currentCSVDataAtom, currentTabAtom } from '../stores/csvStore';

export const TabNavigation: React.FC = () => {
  const [currentTab, setCurrentTab] = useAtom(currentTabAtom);
  const [currentCSVData] = useAtom(currentCSVDataAtom);

  const tabs = [
    { id: 'home', label: '홈', icon: Home, enabled: true },
    { id: 'order', label: '발주서', icon: FileText, enabled: !!currentCSVData },
    { id: 'category', label: '분류', icon: Layers, enabled: !!currentCSVData },
    {
      id: 'summary',
      label: '요약',
      icon: BarChart3,
      enabled: !!currentCSVData,
    },
    {
      id: 'settings',
      label: '설정',
      icon: Settings,
      enabled: !!currentCSVData,
    },
  ] as const;

  const handleTabClick = (tabId: typeof currentTab) => {
    if (tabs.find((tab) => tab.id === tabId)?.enabled) {
      setCurrentTab(tabId);
    }
  };

  return (
    <nav className="flex space-x-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        const isEnabled = tab.enabled;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={!isEnabled}
            className={`
              flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : isEnabled
                  ? 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
