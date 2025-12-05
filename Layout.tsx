import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  BookOpen, 
  Terminal, 
  Stethoscope, 
  GraduationCap, 
  Settings, 
  Moon, 
  Sun,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { getTheme, setTheme } from '../services/storage';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const theme = getTheme();
    setIsDarkMode(theme === 'dark');
    setTheme(theme);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    setTheme(newTheme);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        currentView === view
          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={20} className={currentView === view ? 'text-brand-500' : 'group-hover:text-slate-900 dark:group-hover:text-slate-200'} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
            DM
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">
            DevMentor
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="chat" icon={MessageSquareCode} label="AI Assistant" />
          <NavItem view="tutorials" icon={BookOpen} label="Tutorials" />
          <NavItem view="terminal" icon={Terminal} label="Terminal Help" />
          <NavItem view="diagnostics" icon={Stethoscope} label="Diagnostics" />
          <NavItem view="teacher" icon={GraduationCap} label="Teacher Mode" />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
           <NavItem view="settings" icon={Settings} label="Settings" />
           <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
             <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
               <LogOut size={18} />
             </button>
           </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
            DM
          </div>
          <span className="font-bold text-slate-900 dark:text-white">DevMentor</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} className="text-slate-500" /> : <Menu size={24} className="text-slate-500" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-white dark:bg-slate-900 pt-20 px-4 space-y-2 md:hidden">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="chat" icon={MessageSquareCode} label="AI Assistant" />
          <NavItem view="tutorials" icon={BookOpen} label="Tutorials" />
          <NavItem view="terminal" icon={Terminal} label="Terminal Help" />
          <NavItem view="diagnostics" icon={Stethoscope} label="Diagnostics" />
          <NavItem view="teacher" icon={GraduationCap} label="Teacher Mode" />
          <NavItem view="settings" icon={Settings} label="Settings" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full w-full relative pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};