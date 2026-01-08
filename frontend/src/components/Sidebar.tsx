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
  Package,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inquiries', href: '/inquiries', icon: MessageSquare },
  { name: 'Quotations', href: '/quotations', icon: FileText },
  { name: 'Shipments', href: '/shipments', icon: Ship },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Rates', href: '/rates', icon: Package },
  { name: 'Reports', href: '/reports', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gpi-blue rounded-lg flex items-center justify-center">
            <Ship className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Freight Tracker</h1>
            <p className="text-xs text-gray-500">PT Gateway Prima</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>v1.0.0</p>
          <p className="mt-1">PT Gateway Prima Indonusa</p>
        </div>
      </div>
    </aside>
  );
}
