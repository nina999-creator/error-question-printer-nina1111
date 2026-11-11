import React from 'react';
import { Sparkles, BookOpen, Rocket, Award } from 'lucide-react';

interface HeaderProps {
  activeTab: 'recognize' | 'notebook';
  setActiveTab: (tab: 'recognize' | 'notebook') => void;
  savedCount: number;
  masteredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  masteredCount,
}) => {
  return (
    <header className="no-print bg-white/90 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-40 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Planet Theme Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('recognize')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-md shadow-indigo-200 flex items-center justify-center transition-transform hover:scale-105">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white relative overflow-hidden">
                <span className="text-xl select-none">🪐</span>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 rounded-full blur-[2px] opacity-80" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent tracking-tight">
                  久久的闯关星球
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" /> 全科错题举一反三
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                拍照识错题 · 知识点提炼 · 3倍变式训练 · 易错点深度避坑
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('recognize')}
              className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === 'recognize'
                  ? 'bg-white text-indigo-700 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Rocket className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span>错题识别</span>
              <span className="hidden md:inline ml-1 text-slate-400 font-normal">与生成</span>
            </button>

            <button
              onClick={() => setActiveTab('notebook')}
              className={`flex items-center px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 relative ${
                activeTab === 'notebook'
                  ? 'bg-white text-indigo-700 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1.5 text-indigo-600" />
              <span>历史错题本</span>
              {savedCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-indigo-600 text-white font-bold leading-none">
                  {savedCount}
                </span>
              )}
            </button>
          </div>

          {/* Planet Quest Stats */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium">
              <Award className="w-4 h-4 mr-1.5 text-amber-600" />
              <span>攻克星点：</span>
              <span className="font-bold text-amber-700 ml-1 text-sm">{masteredCount}</span>
              <span className="text-amber-500 mx-1">/</span>
              <span className="text-slate-500">{savedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
