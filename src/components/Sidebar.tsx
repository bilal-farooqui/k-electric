import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Send,
  Users,
  AlertOctagon,
  ZapOff,
  Hammer,
  Layers,
  Flame,
  ChevronLeft,
  ChevronRight,
  User,
  History,
} from 'lucide-react';
import type { UserProfile } from '../types/ptw';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  currentUser: UserProfile;
  activeRoleMode: 'admin' | 'employee';
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, currentUser, activeRoleMode }) => {
  const isAdmin = currentUser.label === 'admin' && activeRoleMode === 'admin';

  const menuItems = isAdmin
    ? [
        {
          category: 'Admin Navigation',
          items: [
            { path: '/admin', name: 'Admin Dashboard', icon: LayoutDashboard },
            { path: '/profile', name: 'Profile Details', icon: User },
          ],
        },
      ]
    : [
        {
          category: 'Navigation',
          items: [
            { path: '/', name: 'Home / Forms', icon: LayoutDashboard },
            { path: '/history', name: 'Submission History', icon: History },
            { path: '/profile', name: 'Profile Details', icon: User },
          ],
        },
        {
          category: 'PTW Operational Forms',
          items: [
            {
              path: '/vehicle-inspection',
              name: '1. Vehicle Inspection',
              shortName: 'Vehicle',
              icon: Truck,
            },
            {
              path: '/tools-ppe',
              name: '2. Tools & PPE Check',
              shortName: 'Tools/PPE',
              icon: Wrench,
            },
            {
              path: '/shift-dispatch',
              name: '3. Shift Dispatching',
              shortName: 'Dispatch',
              icon: Send,
            },
            {
              path: '/toolbox-talk',
              name: '4. Site TBT Form',
              shortName: 'TBT Talk',
              icon: Users,
            },
            {
              path: '/fault-excavation',
              name: '5. Fault / Excavation Req',
              shortName: 'Fault Req',
              icon: AlertOctagon,
            },
            {
              path: '/line-isolation',
              name: '6. Line Isolation PTW',
              shortName: 'Isolation',
              icon: ZapOff,
            },
            {
              path: '/excavation',
              name: '7. Excavation PTW',
              shortName: 'Excavation',
              icon: Hammer,
            },
            {
              path: '/confined-space',
              name: '8. Confined Space PTW',
              shortName: 'Confined',
              icon: Layers,
            },
            {
              path: '/heat-shrink',
              name: '9. Heat Shrink PTW',
              shortName: 'Heat Work',
              icon: Flame,
            },
          ],
        },
      ];

  return (
    <aside 
      className={`h-full bg-brand-primary border-r border-gray-800 text-gray-300 flex flex-col transition-all duration-300 z-30 shrink-0 print:hidden ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Scrollable Menu Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-dark py-5 px-3 space-y-6 select-none">
        {menuItems.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-1.5">
            {!collapsed && (
              <h3 className="text-[10px] font-bold text-gray-400 tracking-widest px-3 mb-2">
                {cat.category}
              </h3>
            )}
            
            <div className="space-y-1">
              {cat.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group relative cursor-pointer ${
                        isActive
                          ? 'bg-brand-navy border-l-4 border-brand-accent text-white shadow-inner shadow-black/20'
                          : 'hover:bg-gray-800/60 hover:text-white border-l-4 border-transparent'
                      }`
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="h-5.5 w-5.5 shrink-0" />
                    
                    {!collapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {collapsed && (
                      <div className="absolute left-16 scale-0 group-hover:scale-100 bg-gray-900 border border-gray-700 text-white text-xs font-semibold px-2 py-1.5 rounded-md shadow-xl transition-all duration-150 z-50 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-gray-800 flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-gray-800 rounded-lg hover:text-white transition-colors cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
};
