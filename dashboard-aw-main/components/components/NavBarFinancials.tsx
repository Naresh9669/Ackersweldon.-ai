"use client"
import * as React from "react"
import { Bell, RefreshCwIcon } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu"
import { SidebarTrigger } from "../ui/sidebar"
import { AnyObject } from "mongoose"
import { cn } from "@/lib/utils"
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"

export function NavBar({ symbol, category }: { symbol: string, category: string }) {
  const categories = [
    {
      name: "Summary",
      url: "/financials/" + symbol,
    },
    {
      name: "Historical",
      url: "/financials/" + symbol + "/historical",
    }
  ]
  return (
    <div className="flex w-full px-3 items-center justify-between sticky top-0 bg-white shadow border rounded-xl z-10">
      <NavigationMenu className="sticky top-0 p-1 w-full m-1">
        <NavigationMenuList>
          <SidebarTrigger title="Toggle Sidebar" className="p-2 hover:bg-gray-300 rounded-lg" />
          <span className="flex-grow text-3xl text-zinc-500 pl-3" title="ACKERS WELDON - R&D">ACKERS WELDON</span>
          <div className="flex justify-evenly items-center gap-1 w-full px-4">

            {CategoryItems(category, categories)}

          </div>
        </NavigationMenuList>
      </NavigationMenu>
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


function CategoryItems(title: String, categories?: Array<AnyObject>) {
  if (categories !== undefined) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-all" title="Category">{title}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-white shadow rounded-md">
            {
              categories.map((item) => (
                <ListItem
                  key={item.name}
                  title={item.name}
                  href={`${item.url}`}
                />
              ))
            }
          </ul>
        </DropdownMenuContent>
      </DropdownMenu>


    )
  }
}
