"use client"
import { User2, Home, Newspaper, Brain, TrendingUp, Search, BarChart3, Shield, Zap } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { SidebarGroupLabel, SidebarMenuSub } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { AnyObject } from "mongoose";
import { WithId } from "mongodb";
import { usePathname, useRouter } from "next/navigation"

export function SideBar({ title }: { title?: string }) {
  const pathName = usePathname();
  const router = useRouter();

  return (
    <Sidebar className="bg-gradient-to-b from-white to-gray-50 border-r border-gray-200/50 shadow-sm min-h-screen w-64 lg:w-64 md:w-64 sm:w-16 flex-shrink-0 z-50 transition-all duration-300">
      <SidebarHeader className="border-b border-gray-200/50 pb-4">
        <a href="/" className="flex flex-col justify-center items-center p-4">
          <div className="w-16 h-16 mb-3 flex items-center justify-center">
            <img 
              src="/ackers-weldon-logo.svg" 
              alt="ACKERS WELDON Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg font-bold text-gray-900 text-center hidden md:block">ACKERS WELDON</h1>
          <h1 className="text-sm font-bold text-gray-900 text-center md:hidden">AW</h1>
        </a>
      </SidebarHeader>

      <SidebarContent className="px-2 md:px-3 flex-1 overflow-y-auto">
        {/* Navigation Menu */}
        <SidebarMenu className="space-y-6">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 hidden md:block">
              Main Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              <MenuSidebar title="Dashboard" isDropdown={false} url="/" open={false} icon={<Home className="w-5 h-5" />} />
              <MenuSidebar title="News & Media" isDropdown={false} url="/news" open={false} icon={<Newspaper className="w-5 h-5" />} />
              <MenuSidebar title="AI Summaries" isDropdown={false} url="/ai-summaries" open={false} icon={<Brain className="w-5 h-5" />} />
              <MenuSidebar title="Financial Data" isDropdown={false} url="/financials" open={false} icon={<TrendingUp className="w-5 h-5" />} />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 hidden md:block">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              <MenuSidebar title="KYC Services" isDropdown={false} url="/KYC" open={false} icon={<Shield className="w-5 h-5" />} />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 hidden md:block">
              Tools & Analytics
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              <MenuSidebar title="General Search" isDropdown={false} url="/general-search" open={false} icon={<Search className="w-5 h-5" />} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200/50 p-2 md:p-4 mt-auto">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <User2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs text-gray-500 hidden md:block">Admin User</p>
          <p className="text-xs text-gray-400 hidden md:block">Administrator</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function MenuSidebar({ title, isDropdown, url, menuItems, open = false, icon }: { title: string, isDropdown: boolean, url?: string, menuItems?: WithId<AnyObject>[], open: boolean, icon?: React.ReactNode }) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (url) {
      router.push(url);
    }
  };

  return (
    <div className="w-full">
      {(!isDropdown) ? (
        <a 
          href={url} 
          onClick={handleClick}
          className="block w-full"
        >
          <SidebarMenuButton className="w-full text-left text-lg hover:bg-gray-100 transition-all flex items-center gap-3 p-3 rounded-lg">
            {icon}
            <span className="font-medium hidden md:block">{title}</span>
          </SidebarMenuButton>
        </a>
      ) : (
        <SidebarMenuItem>
          <Collapsible className="group/collapsible w-full" defaultOpen={open}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-lg gap-1 hover:bg-gray-100 w-full p-3 rounded-lg cursor-pointer flex items-center justify-between">
                {title}
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub className="ml-4 space-y-1">
                {menuItems?.map((item) => (
                  <SidebarMenuItem key={item._id?.toString() || 'default'}>
                    <SidebarMenuButton asChild className="hover:bg-gray-100 w-full">
                      <a href={"/news/" + (item._id?.toString() || '')} className="block w-full p-2 rounded-lg">
                        <span className="text-sm">{item.name}</span>
                        {(item.count > 0) && <span className="ml-auto text-xs bg-gray-400 text-white p-1 rounded-lg">{item.count}</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      )}
    </div>
  )
}