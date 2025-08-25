"use client"
import * as React from "react"
import { User, ExternalLink, Brain, Users, Search } from "lucide-react"
import { Breadcrumb } from "./Breadcrumb";

import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AnyObject } from "mongoose"
import { cn } from "@/lib/utils"
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"

export function NavBar({ categories }: { categories?: Array<AnyObject> }) {
  const searchParams = useSearchParams()
  const pathName = usePathname()
  const category = searchParams.get('category') || 'Category'
  const router = useRouter()

  // External service URLs
  const communityUrl = process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.ackersweldon.com'
  const aiUrl = process.env.NEXT_PUBLIC_OPENWEBUI_URL || 'https://ai.ackersweldon.com'

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col w-full">
      {/* Main Navigation Bar */}
      <div className="flex w-full px-6 py-4 items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <SidebarTrigger 
            title="Toggle Sidebar" 
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900" 
          />
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/ackers-weldon-logo.svg" 
                alt="ACKERS WELDON Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                ACKERS WELDON
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Research & Development</p>
            </div>
          </div>
        </div>

        {/* Center Navigation */}
        <NavigationMenu className="flex-1 max-w-2xl mx-8">
          <NavigationMenuList className="flex space-x-1">
            {CategoryItems(category, categories)}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <a 
            href="/general-search"
            className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Go to Search"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Search</span>
          </a>

          {/* Community Link */}
          <button 
            onClick={() => handleExternalLink(communityUrl)}
            className="flex items-center space-x-2 px-3 py-2 hover:bg-blue-50 rounded-xl transition-all duration-200 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            title="Open Community"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Community</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          {/* AI Portal Link */}
          <button 
            onClick={() => handleExternalLink(aiUrl)}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all duration-200 text-white shadow-sm hover:shadow-md"
            title="Open AI Portal"
          >
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">AI Portal</span>
            <ExternalLink className="w-3 h-3" />
          </button>


          
          {/* User Profile */}
          <button className="flex items-center space-x-2 p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
        <Breadcrumb />
      </div>
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-md font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

function CategoryItems(title: string, categories?: Array<AnyObject>) {
  const pathName = usePathname()
  if (categories !== undefined) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-all" title="Category">{title}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-white shadow rounded-md">
            <ListItem title="All" href={pathName} key="all" />
            {
              categories.map((item) => (
                <ListItem
                  key={item.name}
                  title={item.name}
                  href={`${pathName}?category=${encodeURIComponent(item.name)}`}
                />
              ))
            }
          </ul>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return null
}
