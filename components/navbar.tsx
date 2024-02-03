"use client"
import Link from "next/link"
import React from "react"
import { Flame, Github, Twitter } from "lucide-react"

const Navbar = () => {
  return (
    <nav
      className="h-[8vh] sticky top-0 text-black dark:text-white w-full px-12 border dark:border-gray-50/10 rounded-lg flex 
    justify-between items-center backdrop-blur-lg bg-white/80 dark:bg-black/80"
    >
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 justify-center group">
          <Flame className="group-hover:scale-125 transition-all duration-300" />
          <h2 className="font-medium text-lg group-hover:underline mt-0.5 font-mono">
            MaybeUsefull
          </h2>
        </Link>
        <NavigationMenuDemo />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="https://twitter.com/shriprasanna007"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="icon" variant="ghost">
            <Twitter size={20} />
          </Button>
        </Link>

        <Link
          href="https://github.com/shrix1/maybeusefull"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="icon" variant="ghost">
            <Github size={20} />
          </Button>
        </Link>

        <ThemeSwitcher />
      </div>
    </nav>
  )
}

export default Navbar

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "./ui/button"
import { ThemeSwitcher } from "./theme"

export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-base bg-transparent">
            Tools
          </NavigationMenuTrigger>
          <NavigationMenuContent className="!border !border-gray-100/10">
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/"
                  >
                    <Flame className="h-6 w-6" />
                    <div className="mb-2 mt-4 text-lg font-medium font-mono ">
                      MaybeUsefull
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Maybe Usefull tools for Developers
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem
                href="/sitemap?q=https://exemplary.ai/sitemap.xml"
                title="Sitemap"
              >
                Easily review your sitemap by adding your
                yoursite.com/sitemap.xml.
              </ListItem>
              <ListItem
                href="/meta-tags?q=https://exemplary.ai"
                title="Meta Data/Tags"
              >
                Easily review all website meta tags by adding your link:
                yoursite.com.
              </ListItem>
              <ListItem href="/" title="More coming soon">
                More MaybeUsefull tools coming soon...
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
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
          <div className="text-sm font-medium leading-none font-mono">
            {title}
          </div>
          <p className="text-sm leading-snug text-muted-foreground ">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
