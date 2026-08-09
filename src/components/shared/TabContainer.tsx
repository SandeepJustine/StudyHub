import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabContainerProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

export function TabContainer({ tabs, defaultTab, children }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-grey-light">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.key 
                ? 'border-navy text-navy' 
                : 'border-transparent text-grey-medium hover:text-navy hover:border-grey-light'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children(activeTab)}</div>
    </div>
  );
}
