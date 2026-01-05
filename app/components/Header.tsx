import React from "react";
import { Menu, Bell, Plus, ChevronDown } from "lucide-react";
import Image from "next/image";

export default function Header() {
  return (
    <header className="h-16 bg-[#0088cc] text-white flex items-center justify-between px-4 shadow-md z-10 relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            {/* Logo Placeholder */}
            <div className="text-2xl font-bold flex items-center gap-1">
                <Image width={100} height={50} src="/logo.webp" alt="Logo" className="font-serif italic" />
            </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden sm:flex items-center gap-2 bg-white text-[#0088cc] px-4 py-1.5 rounded font-medium text-sm hover:bg-gray-100 transition-colors">
          <Plus size={16} />
          Create Order
        </button>
        
        <div className="relative">
            <button className="p-2 hover:bg-white/10 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0088cc]"></span>
            </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/20 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-xs font-bold">
            TL
          </div>
          <div className="hidden md:block text-sm">
            <div className="text-xs opacity-80">Welcome</div>
            <div className="font-medium truncate max-w-[150px]">thangluongthanh8@gmail.com</div>
          </div>
          <ChevronDown size={16} className="hidden md:block opacity-70" />
        </div>
      </div>
    </header>
  );
}
