import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';

interface AddressBarProps {
  url: string;
  isLoading: boolean;
  mode: 'ai' | 'live';
  onNavigate: (url: string) => void;
  onRefresh: () => void;
  onBack: () => void;
  onForward: () => void;
  onToggleMode: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const AddressBar: React.FC<AddressBarProps> = ({
  url,
  isLoading,
  mode,
  onNavigate,
  onRefresh,
  onBack,
  onForward,
  onToggleMode,
  canGoBack,
  canGoForward
}) => {
  const [inputValue, setInputValue] = useState(url);

  useEffect(() => {
    setInputValue(url === 'j-zoom://welcome' ? '' : url);
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200 shadow-sm z-20 relative">
      <div className="flex items-center gap-1">
        <button 
          onClick={onBack} 
          disabled={!canGoBack}
          className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${!canGoBack ? 'opacity-30 cursor-not-allowed' : 'text-gray-600'}`}
        >
          <Icons.Back className="w-5 h-5" />
        </button>
        <button 
          onClick={onForward} 
          disabled={!canGoForward}
          className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${!canGoForward ? 'opacity-30 cursor-not-allowed' : 'text-gray-600'}`}
        >
          <Icons.Forward className="w-5 h-5" />
        </button>
        <button 
          onClick={onRefresh} 
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Icons.Refresh className="w-5 h-5" />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Search or enter website name"
            className="w-full bg-gray-100 hover:bg-gray-200 focus:bg-white border-transparent focus:border-indigo-500 border-2 rounded-full py-2 pl-10 pr-24 text-sm outline-none transition-all shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMode}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm
                ${mode === 'ai' 
                  ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700' 
                  : 'bg-green-600 border-green-500 text-white hover:bg-green-700'}
              `}
            >
              <div className={`w-2 h-2 rounded-full bg-white ${mode === 'ai' ? 'animate-pulse' : ''}`}></div>
              {mode === 'ai' ? 'AI View' : 'Real Mode'}
            </button>
          </div>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
             {inputValue.startsWith('http') || inputValue.includes('.') ? (
               <Icons.Globe className="w-4 h-4" />
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                 <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
               </svg>
             )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddressBar;