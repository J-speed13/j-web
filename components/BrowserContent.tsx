import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '../types';

interface BrowserContentProps {
  tab: Tab;
  onNavigate: (url: string) => void;
}

const WelcomeScreen = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    if (q.trim()) onSearch(q);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-gray-50 text-gray-800 p-4">
      <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in-up">
        <h1 className="text-6xl font-bold text-indigo-600 mb-2 select-none tracking-tight">J-Zoom</h1>
        <p className="text-xl text-gray-500 mb-10">The AI Browser Simulator</p>
        
        <form onSubmit={handleSubmit} className="w-full shadow-lg rounded-full mb-12 hover:shadow-xl transition-shadow duration-300 bg-white">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              name="q" 
              autoComplete="off"
              autoFocus
              placeholder="Search or enter URL..." 
              className="w-full py-4 pl-12 pr-6 bg-transparent border-none rounded-full focus:ring-2 focus:ring-indigo-100 text-lg text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </form>

        <div className="grid grid-cols-2 gap-8 text-sm text-gray-400">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
             <span>AI Generated</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span>Real-Time Data</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const BrowserContent: React.FC<BrowserContentProps> = ({ tab, onNavigate }) => {
  const isWelcome = tab.url === 'j-zoom://welcome' || tab.url === '';
  const [loadError, setLoadError] = useState(false);
  const aiIframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for navigation messages from the AI Iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'JZOOM_NAVIGATE') {
        onNavigate(event.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNavigate]);

  if (isWelcome) {
    return <WelcomeScreen onSearch={onNavigate} />;
  }

  // AI MODE RENDERING
  if (tab.mode === 'ai') {
    // Inject script to capture clicks and send to parent
    const safeHtml = tab.content?.html ? tab.content.html + `
      <script>
        document.body.addEventListener('click', (e) => {
          const link = e.target.closest('a');
          if (link && link.href) {
            e.preventDefault();
            window.parent.postMessage({ type: 'JZOOM_NAVIGATE', url: link.href }, '*');
          }
        });
      </script>
    ` : '';

    return (
      <div className="w-full h-full relative bg-white">
         {/* AI Loading State */}
         {tab.isLoading && !tab.content?.html && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium animate-pulse">Generating raw HTML...</p>
           </div>
         )}
         
         {tab.content?.html ? (
           <div className="flex flex-col h-full">
              {/* Source Credits */}
              {tab.content.sourceUrls && tab.content.sourceUrls.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 text-xs text-gray-500 flex gap-2 overflow-x-auto whitespace-nowrap flex-shrink-0">
                   <span className="font-semibold text-gray-400">Sources:</span>
                   {tab.content.sourceUrls.map((s, i) => (
                     <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="hover:text-indigo-600 underline decoration-gray-300">
                       {s.title || new URL(s.uri).hostname}
                     </a>
                   ))}
                </div>
              )}
              
              {/* Use iframe with srcDoc for true HTML isolation */}
              <iframe
                ref={aiIframeRef}
                srcDoc={safeHtml}
                className="w-full flex-1 border-0"
                title="AI Content"
                sandbox="allow-scripts allow-same-origin"
              />
           </div>
         ) : !tab.isLoading ? (
           <div className="flex items-center justify-center h-full text-gray-400">
             No content generated.
           </div>
         ) : null}
      </div>
    );
  }

  // LIVE MODE RENDERING (Iframe)
  return (
    <div className="w-full h-full relative group bg-white">
       {tab.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
             <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
       )}

       <iframe 
          key={tab.url} 
          src={tab.url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-downloads"
          onError={() => setLoadError(true)}
       />
       
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity delay-1000">
          <p className="bg-black/75 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
             Real Site Mode
          </p>
       </div>
    </div>
  );
};

export default BrowserContent;