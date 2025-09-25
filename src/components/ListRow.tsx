import React from 'react';
import { Link } from 'react-router-dom';

type PillColor = 'green' | 'red' | 'gray' | 'orange' | 'blue';

type Props = {
  to?: string;
  state?: unknown;
  onClick?: () => void;
  title: string;
  badgeLabel?: string;
  detail?: string;
  rightPill?: { label: string; color?: PillColor };
  trailingArrow?: boolean;
};

export default function ListRow({
  to,
  state,
  onClick,
  title,
  badgeLabel,
  detail,
  rightPill,
  trailingArrow = true,
}: Props) {
  const pillClasses = (color: PillColor = 'gray') =>
    `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ` +
    (color === 'green'
      ? 'text-green-700 bg-green-50 border-green-200 dark:text-green-200 dark:bg-green-900/30 dark:border-green-800'
      : color === 'red'
      ? 'text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-900/30 dark:border-red-800'
      : color === 'orange'
      ? 'text-yn-orange bg-yn-orange/10 border-yn-orange/20'
      : color === 'blue'
      ? 'text-yn-blue bg-yn-blue/10 border-yn-blue/20'
      : 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-[#1e242b] dark:border-[#2b3238]');

  const content = (
    <div className="group flex items-center justify-between gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#232932] transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-gray-900 dark:text-gray-100">{title}</p>
          {badgeLabel && (
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-[#2b3238] px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1e242b]">
              {badgeLabel}
            </span>
          )}
        </div>
        {detail && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 truncate">{detail}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {rightPill && <span className={pillClasses(rightPill.color)}>{rightPill.label}</span>}
        {trailingArrow && (
          <span className="text-yn-orange group-hover:translate-x-0.5 transition-transform">›</span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <li className="p-0">
        <Link to={to} state={state} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className="p-0">
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    </li>
  );
}

