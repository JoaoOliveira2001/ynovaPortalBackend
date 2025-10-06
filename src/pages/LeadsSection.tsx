import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function LeadsSection() {
  const tabs = [{ to: '/leads/simulation', label: 'Balanço Energético', end: true }];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
        <div className="mt-4 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-[#2b3238]">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={(t as any).end}
                className={({ isActive }) =>
                  `px-3 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors min-w-0 whitespace-normal text-center sm:text-left sm:whitespace-nowrap ${
                    isActive
                      ? 'border-yn-orange text-yn-orange'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
