
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  CreditCard, 
  Settings, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  icon: React.ElementType;
  title: string;
  path: string;
  active: boolean;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  title, 
  path, 
  active, 
  collapsed 
}) => {
  return (
    <Link 
      to={path} 
      className={cn(
        "flex items-center py-3 px-4 text-sm rounded-md transition-colors",
        active 
          ? "bg-konipai-500 text-white" 
          : "text-gray-600 hover:bg-konipai-100 hover:text-konipai-700",
        collapsed && "justify-center"
      )}
    >
      <Icon size={20} className={cn(collapsed ? "mx-0" : "mr-3")} />
      {!collapsed && <span>{title}</span>}
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { title: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { title: 'Customers', path: '/admin/customers', icon: Users },
    { title: 'Products', path: '/admin/products', icon: Package },
    { title: 'Payments', path: '/admin/payments', icon: CreditCard },
    { title: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div 
      className={cn(
        "bg-white h-full border-r flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && <span className="text-xl font-bold text-konipai-800">Konipai</span>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      
      {/* Navigation items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            title={item.title}
            path={item.path}
            active={location.pathname === item.path}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </div>
  );
};
