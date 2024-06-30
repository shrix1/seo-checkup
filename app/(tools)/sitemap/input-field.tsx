"use client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { postDiscordLogs } from "@/lib/discord-webhook"
import { compareUrls, getSitemapBaseUrl, removeCommonPrefix } from "@/lib/utils"
import { Loader } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import {
  SitemapToJSX,
  restructureSitemap,
  sortSitemapStructure,
} from "./generate-deep-routes"

const InputField = ({ query }: { query: string }) => {
  const router = useRouter()
  const [value, setValue] = useState<string>("")
  const [data, setData] = useState<string[]>([])
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [loading, setloading] = useState(false)
  const [error, setError] = useState(false)
  const [sitemapWithDeepRoutes, setSitemapWithDeepRoutes] = useState<
    Array<string | { [key: string]: string | any[] }>
  >([])

  useEffect(() => {
    const q = decodeURIComponent(query)
    setValue(q || "https://exemplary.ai/sitemap.xml")
  }, [query])

  useEffect(() => {
    if (value) {
      router.push(`/sitemap?q=${encodeURIComponent(value)}`)
    }
  }, [value])

  useEffect(() => {
    ;(async () => {
      const { baseUrl: base, urls, sitemapWithDeepRoutes } = await getUrls()
      setSitemapWithDeepRoutes(sitemapWithDeepRoutes)
      setBaseUrl(base)
      setData(urls)
    })()
  }, [])

  async function getUrls(): Promise<{
    baseUrl: string
    urls: string[]
    sitemapWithDeepRoutes: Array<string | { [key: string]: string | any[] }>
  }> {
    try {
      setloading(true)
      const data = await fetchSitemapUrl(query)
      const sitemapWithDeepRoutes = restructureSitemap(data)
      const sortedSitemapDeepRoutes = sortSitemapStructure(
        sitemapWithDeepRoutes
      )
      const sortedUrls = data.sort(compareUrls)
      const baseUrl = getSitemapBaseUrl(query)
      const modifiedUrls = sortedUrls.map((url) =>
        removeCommonPrefix(url, baseUrl)
      )
      setError(false)
      setloading(false)
      return {
        baseUrl,
        urls: modifiedUrls,
        sitemapWithDeepRoutes: sortedSitemapDeepRoutes,
      }
    } catch (e) {
      setloading(false)
      setError(true)
      return { baseUrl: "", urls: [], sitemapWithDeepRoutes: [] }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { baseUrl: base, urls, sitemapWithDeepRoutes } = await getUrls()
    await postDiscordLogs(decodeURIComponent(query), "SITEMAP")
    if (urls.length === 0) {
      setError(true)
    }
    setSitemapWithDeepRoutes(sitemapWithDeepRoutes)
    setBaseUrl(base)
    setData(urls)
  }

  async function fetchSitemapUrl(url: string): Promise<string[]> {
    try {
      const data: any = await fetch(`/api/v1?q=${url}`)
      const xmlData = await data.json()

      let locValues: string[] = []
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlData, "application/xml")
      const locNodes = xmlDoc.querySelectorAll("loc")
      locNodes.forEach((locNode) => {
        locValues.push(locNode.textContent as string)
      })
      return locValues
    } catch (error: any) {
      setError(true)
      console.error("Error fetching or parsing XML:", error.message)
      return []
    }
  }

  return (
    <>
      <div className="w-full flex justify-center flex-col items-center px-4 md:px-0">
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-[400px] flex justify-center my-6 items-center h-[60px] sticky top-4 rounded-lg"
        >
          <Input
            onChange={(e) => setValue(e.target.value)}
            value={value}
            type="text"
            autoFocus
            placeholder="yoursite.com/sitemap.xml"
            className="text-base h-[50px] dark:bg-white font-mono text-white dark:text-black bg-black"
          />
        </form>
        <p className="text-sm text-gray-500 -mt-6 mb-10">
          check your{" "}
          <span className="font-medium text-black dark:text-white">
            sitemap.xml
          </span>{" "}
          route naming before using this tool
        </p>
        <section className="flex gap-4 items-center">
          {loading ? (
            <></>
          ) : (
            data.length !== 0 && (
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <Badge className="underline font-medium font-mono text-base underline-offset-2">
                  {baseUrl}
                </Badge>

                <span>
                  Number of Links
                  <Badge className="underline ml-2 font-medium font-mono text-base underline-offset-2">
                    {data.length}
                  </Badge>
                </span>
              </div>
            )
          )}
        </section>

        {loading ? (
          <div className="px-5 text-lg py-2 bg-blue-50 text-blue-600 flex justify-center rounded-lg items-center gap-3">
            <Loader className="animate-spin" />
            Loading
          </div>
        ) : data.length === 0 || error ? (
          <>
            <div className="px-3 flex items-center justify-center mt-4 w-full md:w-[400px] gap-4 py-3 bg-red-100 text-red-600 rounded-lg">
              <p>
                {" "}
                Its seems like the sitemap url:{" "}
                <span className="underline font-medium">{value}</span> is not
                exist or Try Refreshing.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 max-w-5xl mt-8">
              {/* {data.map((url, idx) => (
                <Link
                  key={url + idx}
                  href={`${baseUrl}${url}`}
                  target="_blank"
                  className="text-base hover:underline underline-offset-2 dark:hover:bg-gray-100/20 hover:bg-gray-200 hover:dark:text-white px-2 py-1 rounded-lg"
                >
                  <p>{url}</p>
                </Link>
              ))} */}
              <SitemapToJSX sitemap={sitemapWithDeepRoutes} baseUrl={baseUrl} />
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default InputField
