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
import React from "react"

type SitemapItem = string | { [key: string]: string | SitemapItem[] }

export function SitemapToJSX({
  sitemap,
  baseUrl,
}: {
  sitemap: SitemapItem[]
  baseUrl: string
}): JSX.Element {
  const createListItem = (
    item: SitemapItem,
    key?: string,
    isLeaf?: boolean
  ): JSX.Element => {
    if (typeof item === "string") {
      return (
        <li
          key={item}
          className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg w-fit p-1"
        >
          <a
            href={!isLeaf ? baseUrl + item : baseUrl + "/" + key + item}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item}
          </a>
        </li>
      )
    } else if (typeof item === "object") {
      const [key, value] = Object.entries(item)[0]
      return (
        <li key={key}>
          <details>
            <summary>{key}</summary>
            <ul>
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
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-y-3 md:gap-x-8 md:gap-y-4">
      {sitemap.map((item, index) =>
        React.cloneElement(createListItem(item), { key: index })
      )}
    </ul>
  )
}
