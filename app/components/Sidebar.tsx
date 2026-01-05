import React from "react";
import { BookOpen, Folder, CreditCard, Settings, ChevronRight } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { icon: BookOpen, label: "My Orders", active: false },
    { icon: Folder, label: "Services", active: false },
    { icon: CreditCard, label: "Payment", active: false },
    { icon: Settings, label: "Setting", active: false, hasSubmenu: true },
  ];

  return (
    <aside className="w-64 bg-white h-[calc(100vh-64px)] border-r border-gray-200 hidden md:block flex-shrink-0">
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href="#"
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              item.active
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} />
              <span>{item.label}</span>
            </div>
            {item.hasSubmenu && <ChevronRight size={16} className="text-gray-400" />}
          </a>
        ))}
      </nav>
    </aside>
  );
}
