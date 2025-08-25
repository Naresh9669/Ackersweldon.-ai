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

export function Historicalfilter() {
  const [position, setPosition] = React.useState("")

  const pathName = usePathname();
  const router = useRouter();

  const handleValueChange = (query: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('filter', query);
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
        <Button variant="outline">Filter</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value="">Historical Prices</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="div">Dividents Only</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="split">Stock Splits</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="earn">Capital Gains</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
