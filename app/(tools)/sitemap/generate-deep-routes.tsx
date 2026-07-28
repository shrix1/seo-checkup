import type { ReactElement } from "react"

export function sortSitemapStructure(sitemap: any[]) {
  const isObject = (item: any) =>
    typeof item === "object" && item !== null && !Array.isArray(item)
  const strings = sitemap.filter((item) => typeof item === "string")
  const objects = sitemap.filter(isObject)
  strings.sort((a, b) => a.localeCompare(b))
  return [...strings, ...objects]
}

export const restructureSitemap = (links: string[]) => {
  const result: { root?: string[] } = {}

  const addToNestedStructure = (
    obj: Record<string, any>,
    parts: string[],
    isLeaf: boolean
  ) => {
    const key = parts[0]
    if (parts.length === 1) {
      if (!obj[key]) obj[key] = []
      obj[key].push(isLeaf ? "/" : { "/": [] })
    } else {
      if (!obj[key]) obj[key] = []
      let target = obj[key].find(
        (item: any) =>
          typeof item === "object" && Object.keys(item)[0] === parts[1]
      )
      if (!target) {
        target = { [parts[1]]: [] }
        obj[key].push(target)
      }
      addToNestedStructure(target, parts.slice(1), isLeaf)
    }
  }

  links.forEach((link) => {
    const url = new URL(link)
    const pathParts = url.pathname.split("/").filter((part) => part)

    if (pathParts.length === 0) {
      if (!result.root) result.root = []
      result.root.push("/")
    } else {
      addToNestedStructure(result, pathParts, true)
    }
  })

  // Convert the result object to the desired array format
  const convertToArray = (
    obj: Record<string, any>
  ): Array<string | { [key: string]: string | any[] }> => {
    return Object.entries(obj).map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 1 && value[0] === "/") {
          return `/${key}`
        } else {
          const nestedArray = value.map((item) => {
            if (typeof item === "object") {
              return convertToArray(item)[0]
            }
            return item
          })
          return { [key]: nestedArray }
        }
      }
      return { [key]: convertToArray(value) }
    })
  }

  return convertToArray(result)
}

import { ChevronRight } from "lucide-react"
import React from "react"

type SitemapItem = string | { [key: string]: string | SitemapItem[] }

/**
 * Native <details>/<summary> kept deliberately — it is accessible, needs no JS,
 * and nests arbitrarily. Only the browser-default disclosure triangle and
 * unstyled rows are replaced.
 */
export function SitemapToJSX({
  sitemap,
  baseUrl,
}: {
  sitemap: SitemapItem[]
  baseUrl: string
}): ReactElement {
  const createListItem = (
    item: SitemapItem,
    key?: string,
    isLeaf?: boolean
  ): ReactElement => {
    if (typeof item === "string") {
      return (
        <li key={item}>
          <a
            href={!isLeaf ? baseUrl + item : baseUrl + "/" + key + item}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate rounded px-1.5 py-1 font-mono text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={!isLeaf ? baseUrl + item : baseUrl + "/" + key + item}
          >
            {item}
          </a>
        </li>
      )
    } else if (typeof item === "object") {
      const [key, value] = Object.entries(item)[0]
      const count = Array.isArray(value) ? value.length : 0
      return (
        <li key={key}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)] group-open:rotate-90"
                aria-hidden
              />
              <span className="truncate font-mono font-medium">{key}</span>
              <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground tabular">
                {count}
              </span>
            </summary>
            <ul className="ml-[0.6875rem] border-l pl-2">
              {Array.isArray(value) &&
                value.map((subItem, index) =>
                  React.cloneElement(createListItem(subItem, key, true), {
                    key: index,
                  })
                )}
            </ul>
          </details>
        </li>
      )
    }
    return <></>
  }

  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
      {sitemap.map((item, index) =>
        React.cloneElement(createListItem(item), { key: index })
      )}
    </ul>
  )
}
