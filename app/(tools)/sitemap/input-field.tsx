"use client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { compareUrls, getSitemapBaseUrl, removeCommonPrefix } from "@/lib/utils"
import { Loader, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

const InputField = ({ query }: { query: string }) => {
  const router = useRouter()
  const [value, setValue] = useState<string>("")
  const [data, setData] = useState<string[]>([])
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [loading, setloading] = useState(false)
  const [error, setError] = useState(false)

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
      const { baseUrl: base, urls } = await getUrls()
      setBaseUrl(base)
      setData(urls)
    })()
  }, [])

  async function getUrls(): Promise<{ baseUrl: string; urls: string[] }> {
    try {
      setloading(true)
      const data = await fetchSitemapUrl(query)
      const sortedUrls = data.sort(compareUrls)
      const baseUrl = getSitemapBaseUrl(query)
      const modifiedUrls = sortedUrls.map((url) =>
        removeCommonPrefix(url, baseUrl)
      )
      setError(false)
      setloading(false)
      console.log(modifiedUrls)
      return { baseUrl, urls: modifiedUrls }
    } catch (e) {
      setloading(false)
      setError(true)
      return { baseUrl: "", urls: [] }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { baseUrl: base, urls } = await getUrls()
    if (urls.length === 0) {
      setError(true)
    }
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
      <div className="w-full flex justify-center flex-col items-center">
        <form
          onSubmit={handleSubmit}
          className="w-[400px] flex justify-center my-6 items-center h-[60px] sticky top-4 rounded-lg"
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
        <section className="flex gap-4 items-center">
          {loading ? (
            <></>
          ) : (
            data.length !== 0 && (
              <>
                <Badge className="underline font-medium font-mono text-base underline-offset-2">
                  {baseUrl}
                </Badge>

                <span>
                  Number of Links
                  <Badge className="underline ml-2 font-medium font-mono text-base underline-offset-2">
                    {data.length}
                  </Badge>
                </span>
              </>
            )
          )}
        </section>

        {loading ? (
          <div className="px-5 text-lg py-2 bg-blue-50 text-blue-600 flex justify-center items-center gap-3">
            <Loader className="animate-spin" />
            Loading
          </div>
        ) : data.length === 0 || error ? (
          <>
            <div className="px-6 flex items-center justify-center mt-4 w-[400px] gap-4 py-5 bg-teal-100 text-teal-600 rounded-lg">
              Try Refreshing devs
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 max-w-5xl mt-8">
              {data.map((url) => (
                <Link
                  key={url}
                  href={`${baseUrl}${url}`}
                  target="_blank"
                  className="text-base hover:underline underline-offset-2 dark:hover:bg-gray-100/20 hover:bg-gray-200 hover:dark:text-white px-2 py-1 rounded-lg"
                >
                  <p>{url}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default InputField
