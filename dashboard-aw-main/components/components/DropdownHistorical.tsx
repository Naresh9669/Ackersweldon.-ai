"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export function DropdownHistorical() {
  const [position, setPosition] = React.useState("1d")

  const pathName = usePathname();
  const router = useRouter();

  const handleValueChange = (query: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('interval', query);
    const queryString = params.toString();
    const updatedPath = `${pathName}${queryString ? `?${queryString}` : ''}`
    router.push(updatedPath);
  };

  useEffect(() => {
        handleValueChange(position);
      }, [position]);
  

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Interval</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value="1d">Daily</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="1wk">Weekly</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="1mo">Monthly</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
