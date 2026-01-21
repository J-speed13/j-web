import React, { useState, useEffect, useCallback } from 'react';
import TabSystem from './components/TabSystem';
import AddressBar from './components/AddressBar';
import BrowserContent from './components/BrowserContent';
import { Tab, WebPageContent } from './types';
import { generatePageContent } from './services/geminiService';
import { INITIAL_URL } from './constants';

const simpleId = () => Math.random().toString(36).substr(2, 9);

// Sites that strictly block iframes via X-Frame-Options
// These will be forced to AI mode by default, but can be overridden manually
const BLOCKED_DOMAINS = [
  'github.com',
  'twitter.com', 
  'x.com',
  'facebook.com',
  'youtube.com',
  'instagram.com',
  'linkedin.com',
  'reddit.com',
  'netflix.com',
  'amazon.com'
];

// Helper to check if a hostname is blocked
const isDomainBlocked = (hostname: string) => {
  return BLOCKED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
};

// Helper to determine if input is a URL or search query
const formatUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed || trimmed === 'j-zoom://welcome') return 'j-zoom://welcome';
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}&igu=1`;
};

const getDisplayTitle = (url: string, content?: WebPageContent | null) => {
  if (content?.title) return content.title;
  if (url === 'j-zoom://welcome') return 'Welcome';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Browsing';
  }
};

const createNewTab = (): Tab => ({
  id: simpleId(),
  url: INITIAL_URL,
  title: 'Welcome',
  isLoading: false,
  history: [INITIAL_URL],
  historyIndex: 0,
  content: null,
  mode: 'ai'
});

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([createNewTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Initialize Welcome Content
  useEffect(() => {
    if (activeTab.url === INITIAL_URL && !activeTab.content) {
       handleNavigate(activeTabId, INITIAL_URL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(tab => tab.id === id ? { ...tab, ...updates } : tab));
  };

  const handleNavigate = useCallback(async (
    tabId: string, 
    input: string, 
    isHistoryNav = false, 
    forceMode?: 'ai' | 'live'
  ) => {
    // Note: We use the function form of setTabs inside here implicitly via updateTab if we needed latest state, 
    // but here we need the tab object to determine logic. 
    // Since this callback depends on [tabs], it receives the tabs state at the time of creation.
    // For rapid updates (like toggle), passing forceMode ensures we don't rely on stale tab.mode.
    
    // However, to ensure we get the absolute latest tab state for logic that depends on other tab properties,
    // we should ideally use a functional update pattern or a ref, but given the structure, 
    // relying on the dependency array with [tabs] is acceptable for a browser simulator.
    
    const tabToUpdate = tabs.find(t => t.id === tabId);
    if (!tabToUpdate) return; 

    const finalUrl = isHistoryNav ? input : formatUrl(input);
    let targetMode = forceMode || tabToUpdate.mode;

    // Smart Mode Switching: Only apply if NOT forcing a mode manually
    if (!forceMode) {
      try {
        const urlObj = new URL(finalUrl);
        if (targetMode === 'live' && isDomainBlocked(urlObj.hostname)) {
          targetMode = 'ai';
          console.log(`Auto-switching to AI mode for blocked domain: ${urlObj.hostname}`);
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    }

    // 1. Update State to Loading
    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        let newHistory = t.history;
        let newIndex = t.historyIndex;
        
        if (!isHistoryNav && finalUrl !== t.url) {
           newHistory = t.history.slice(0, t.historyIndex + 1);
           newHistory.push(finalUrl);
           newIndex = newHistory.length - 1;
        }

        return { 
          ...t, 
          isLoading: true, 
          url: finalUrl,
          title: getDisplayTitle(finalUrl, t.content),
          history: newHistory,
          historyIndex: newIndex,
          mode: targetMode // Apply smart mode or force mode
        };
      }
      return t;
    }));

    // 2. Fetch Content based on Mode
    if (targetMode === 'ai') {
      try {
        const content = await generatePageContent(finalUrl);
        updateTab(tabId, { 
          isLoading: false, 
          content,
          title: content.title 
        });
      } catch (e) {
        updateTab(tabId, { isLoading: false, title: 'Error' });
      }
    } else {
      // Live Mode: Just wait a bit to simulate processing or wait for iframe load
      setTimeout(() => {
        updateTab(tabId, { isLoading: false });
      }, 1500);
    }

  }, [tabs]);

  const navigateCurrent = (url: string) => handleNavigate(activeTabId, url);

  const handleRefresh = () => {
    handleNavigate(activeTabId, activeTab.url, true);
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevUrl = activeTab.history[activeTab.historyIndex - 1];
      handleNavigate(activeTabId, prevUrl, true);
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextUrl = activeTab.history[activeTab.historyIndex + 1];
      handleNavigate(activeTabId, nextUrl, true);
    }
  };

  const handleToggleMode = () => {
    const newMode = activeTab.mode === 'ai' ? 'live' : 'ai';
    // We pass newMode as forceMode to bypass the blocked domain check
    handleNavigate(activeTabId, activeTab.url, true, newMode);
  };

  const handleNewTab = () => {
    const newTab = createNewTab();
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    handleNavigate(newTab.id, INITIAL_URL);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-browser-bg text-browser-text font-sans overflow-hidden">
      <div className="flex flex-col w-full shadow-md z-50">
        <TabSystem 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onSwitchTab={setActiveTabId} 
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
        />
        <AddressBar 
          url={activeTab.url === 'j-zoom://welcome' ? '' : activeTab.url}
          isLoading={activeTab.isLoading}
          mode={activeTab.mode}
          onNavigate={navigateCurrent}
          onRefresh={handleRefresh}
          onBack={handleBack}
          onForward={handleForward}
          onToggleMode={handleToggleMode}
          canGoBack={activeTab.historyIndex > 0}
          canGoForward={activeTab.historyIndex < activeTab.history.length - 1}
        />
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-100">
        {tabs.map(tab => (
           <div 
             key={tab.id} 
             className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${tab.id === activeTabId ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
           >
             <BrowserContent 
               tab={tab} 
               onNavigate={(url) => handleNavigate(tab.id, url)}
             />
           </div>
        ))}
      </div>
    </div>
  );
}