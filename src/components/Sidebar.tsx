import { useState, useCallback, useEffect, useRef } from 'react';
import { LayoutDashboard, Calendar, GripVertical, Shield, ChevronRight, FolderSync, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [width, setWidth] = useState(248);
  const isResizing = useRef(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = () => supabase.auth.signOut();

  const displayName = user?.user_metadata?.full_name || user?.email || 'Trader';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = e.clientX;
      if (newWidth > 220 && newWidth < 380) {
        setWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', description: 'Performance overview' },
    { icon: FolderSync, label: 'Imports & Sync', value: 'Sync', description: 'Data operations and helper status' },
    { icon: Shield, label: 'Prop Safety', value: 'Safety', description: 'Risk and rule checks' },
    { icon: Calendar, label: 'Trade Calendar', value: 'Calendar', description: 'Day-by-day history' },
  ];

  return (
    <aside
      style={{ width: `${width}px` }}
      className="border-r border-white/10 flex flex-col h-screen px-5 py-6 bg-[linear-gradient(180deg,#0d1117_0%,#0b1220_100%)] relative transition-none shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]"
    >
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/30 group flex items-center justify-center transition-colors"
      >
        <GripVertical className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 mb-7 overflow-hidden">
        <div className="flex items-center gap-3 mb-4 whitespace-nowrap">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="text-[10px] uppercase tracking-[0.32em] text-slate-500 font-black">Tradovate</div>
            <div className="text-2xl font-black tracking-tight truncate">TraderDash</div>
          </div>
        </div>

      </div>

      <nav className="flex-1 flex flex-col gap-2.5 overflow-hidden">
        {menuItems.map((item) => {
          const itemValue = item.value || item.label;
          const active = activeTab === itemValue;

          return (
            <button
              key={item.label}
              onClick={() => onTabChange(itemValue)}
              className={`w-full text-left rounded-2xl border px-3 py-3 transition-all ${active
                ? 'border-indigo-500/25 bg-indigo-500/12 text-white shadow-[0_10px_30px_rgba(79,70,229,0.12)]'
                : 'border-transparent bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${active ? 'border-indigo-400/20 bg-indigo-500/15 text-indigo-300' : 'border-white/8 bg-white/[0.03] text-slate-500'}`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{item.label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{item.description}</div>
                </div>
                {active ? <ChevronRight className="w-4 h-4 text-indigo-300 shrink-0" /> : null}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 pt-5 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-3 bg-white/[0.03] border border-white/8 rounded-2xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-11 h-11 rounded-2xl flex-shrink-0 object-cover shadow-lg" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20">
              {initials}
            </div>
          )}
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-sm font-semibold truncate text-white">{displayName}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest truncate font-black">Trading workspace</span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
