import React from 'react';
import { Tab } from '../types';
import { Icons } from '../constants';

interface TabSystemProps {
  tabs: Tab[];
  activeTabId: string;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
}

const TabSystem: React.FC<TabSystemProps> = ({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab
}) => {
  return (
    <div className="flex items-end bg-gray-200 pt-2 px-2 gap-1 overflow-x-auto select-none no-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSwitchTab(tab.id)}
            className={`
              group relative flex items-center justify-between w-48 max-w-[200px] min-w-[120px] px-3 py-2 rounded-t-lg cursor-pointer text-sm transition-all
              ${isActive ? 'bg-white text-gray-800 shadow-sm z-10' : 'bg-gray-300 text-gray-600 hover:bg-gray-250'}
            `}
          >
            <div className="flex items-center gap-2 overflow-hidden mr-6">
              {tab.isLoading ? (
                <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
              ) : (
                <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
              )}
              <span className="truncate font-medium text-xs">
                {tab.title || (tab.url === 'j-web://welcome' ? 'Welcome' : 'New Tab')}
              </span>
            </div>
            
            <button
              onClick={(e) => onCloseTab(tab.id, e)}
              className={`
                absolute right-2 p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity
                ${isActive ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-400 text-gray-600'}
              `}
            >
              <Icons.XMark className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      
      <button
        onClick={onNewTab}
        className="p-1.5 mb-1 ml-1 rounded-full hover:bg-gray-300 text-gray-600 transition-colors"
      >
        <Icons.Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TabSystem;