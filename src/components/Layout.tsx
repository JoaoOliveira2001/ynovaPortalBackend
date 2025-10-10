import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link} from 'react-router-dom';
import {
  Home,
  Calendar,
  Calculator,
  FileText,
  PieChart,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Handshake,
} from 'lucide-react';
import CrownIcon from './icons/CrownIcon';
import { mockUser } from '../data/mockData';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/contratos', label: 'Contratos', icon: PieChart },
  { to: '/simulacao', label: 'Simulação', icon: Calculator },
  { to: '/leads', label: 'Balanço Energético', icon: FileText },
  /* { to: '/negociacoes', label: 'Negociações', icon: Handshake }, */
  /* { to: '/agenda', label: 'Agenda', icon: Calendar }, */
  { to: '/profile', label: 'Perfil', icon: User },
 /*  { to: '/ranking', label: 'Ranking', icon: CrownIcon }, */
  /* { to: '/training', label: 'Treinamento para Consultor', icon: GraduationCap }, */
 /*  { to: '/notifications', label: 'Notificações', icon: Bell }, */
  { to: '/help', label: 'Ajuda', icon: HelpCircle },
];

interface LayoutProps {
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Layout({ onLogout, theme, toggleTheme }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const user = mockUser;

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#111418] dark:text-gray-100">
      <header
        role="banner"
        className="sticky top-0 z-50 h-16 bg-yn-orange text-white shadow-sm px-4 md:px-6"
      >
        <div className="flex items-center justify-between h-full">
        <Link
            to="/dashboard"
            aria-label="Ir para a pÃ¡gina inicial"
            className="flex items-center gap-2"
          >
            {logoError ? (
              <span className="font-semibold text-white">YNOVA</span>
            ) : (
              <img
                src="https://i.imgur.com/eFBlDDM.png"
                alt="YNOVA"
                className="h-40 md:h-40 w-auto"
                loading="eager"
                onError={() => setLogoError(true)}
              />
            )}
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button
                className="p-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="NotificaÃ§Ãµes"
                onClick={() => setShowNotifications((p) => !p)}
              >
                <Bell size={20} />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1f24] border border-gray-200 dark:border-[#2b3238] rounded-lg shadow-lg p-4 text-sm text-gray-700 dark:text-gray-200">
                  <ul className="space-y-2">
                    <li>Verifique seu e-mail</li>
                    <li>Nova mensagem da gestÃ£o</li>
                    <li>Duas reuniÃµes perdidas</li>
                  </ul>
                </div>
              )}
            </div>
            <label className="hidden">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <div className="w-11 h-6 bg-white/30 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30"></div>
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                aria-hidden
              >
                <span className="text-white text-sm font-medium">
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-white">
                {user.name}
              </span>
            </div>
            <button
              className="md:hidden p-2 rounded-md text-white hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:top-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1a1f24] border-r border-gray-200 dark:border-[#2b3238]">
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-yn-orange/10 text-yn-orange border border-yn-orange/40 dark:bg-yn-orange/20 dark:text-yn-orange dark:border-yn-orange/40'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1f252b]'
                      }`
                    }
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-[#2b3238]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" role="dialog" aria-modal="true">
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#1a1f24]">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-[#2b3238]">
                <div className="text-xl font-bold text-yn-orange">YNOVA</div>
                <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
                  <X size={24} />
                </button>
              </div>
              <nav className="px-4 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                        `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-yn-orange/10 text-yn-orange border border-yn-orange/40 dark:bg-yn-orange/20 dark:text-yn-orange dark:border-yn-orange/40'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1f252b]'
                        }`
                    }
                  >
                      <Icon size={20} className="mr-3" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-[#2b3238]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                >
                  <LogOut size={20} className="mr-3" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 md:ml-64">
          <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 overflow-x-hidden py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


