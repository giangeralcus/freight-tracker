import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Ship,
  Users,
  Building2,
  Settings,
  TrendingUp,
  Calendar,
  Package,
  DollarSign,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inquiries', href: '/inquiries', icon: MessageSquare },
  { name: 'Quotations', href: '/quotations', icon: FileText },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'Shipments', href: '/shipments', icon: Ship },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Rates', href: '/rates', icon: Package },
  { name: 'Currency', href: '/currency', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function getLinkClass(isActive: boolean): string {
  const base = 'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors';
  if (isActive) {
    return base + ' bg-white text-blue-600 shadow-sm border border-gray-100';
  }
  return base + ' text-gray-600 hover:bg-white hover:text-gray-900';
}

export function Sidebar() {
  return (
    <aside className="w-56 bg-gray-50 border-r border-gray-100 h-screen sticky top-0 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800 text-sm">Freight Tracker</span>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => getLinkClass(isActive)}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">GPI v1.0</p>
      </div>
    </aside>
  );
}
