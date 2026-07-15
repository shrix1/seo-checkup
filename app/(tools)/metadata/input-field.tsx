"use client"

import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Loader, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { logToolUsage } from "@/lib/log-tool-usage"
import Link from "next/link"

const DEFAULT_SITE = "https://shrix1.com"

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITE
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

const InputFieldMetadata = ({ query }: { query: string }) => {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ogImage, setOgImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [url, setUrl] = useState("")
  const hasFetched = useRef(false)

  const fetchMetadata = useCallback(async (target: string) => {
    if (!target) {
      setError(true)
      return
    }
    try {
      setLoading(true)
      setError(false)
      const data = await fetch(`/api/v1?q=${encodeURIComponent(target)}`)
      const jsonData = await data.json()

      if (data.status === 429 || jsonData.error === "Rate limit exceeded") {
        const resetMs = jsonData.reset ?? jsonData.data?.reset
        const hours =
          typeof resetMs === "number"
            ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
            : "?"
        alert(`You reached the limit, try again in ${hours} hours or later`)
        return
      }

      if (!data.ok || typeof jsonData !== "string") {
        setError(true)
        return
      }

      await logToolUsage(target, "METADATA")

      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = jsonData

      const pageTitle = tempDiv.querySelector("title")?.textContent
      setTitle(pageTitle || "Untitled")

      const pageDescription = tempDiv
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
      setDescription(pageDescription || "Untitled")

      const ogImageUrl = tempDiv
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content")
      setOgImage(ogImageUrl || "")

      setUrl(target)
    } catch (err) {
      console.error("Error fetching metadata:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void fetchMetadata(initial)
  }, [fetchMetadata, initial])

  return (
    <div className="w-full flex justify-center flex-col items-center px-4 md:px-0 ">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (value === initial) {
            await fetchMetadata(value)
            return
          }
          router.replace(`/metadata?q=${encodeURIComponent(value)}`)
        }}
        className="w-full md:w-[400px] flex justify-center my-6 items-center h-[70px] sticky top-2 rounded-lg flex-col"
      >
        <Input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          type="text"
          autoFocus
          placeholder="yoursite.com"
          className="text-base min-h-[50px] dark:bg-white font-mono text-white dark:text-black bg-black"
        />
      </form>
      <p className="text-sm text-muted-foreground mb-10 -mt-8">
        example url:{" "}
        <Link href="https://shrix1.com" target="_blank">
          <span className="font-medium text-foreground">https://shrix1.com</span>
        </Link>
      </p>

      {error && (
        <div className="px-6 flex items-center justify-center mt-4 w-full md:w-[400px] gap-4 py-5 bg-teal-100 text-teal-600 rounded-lg">
          Try Again
        </div>
      )}

      {loading ? (
        <div className="px-5 text-lg py-2 bg-blue-50 text-blue-600 flex justify-center items-center gap-3">
          <Loader className="animate-spin" />
          Loading
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-8 max-w-xl">
          <MetaDataContainer title="Google">
            <div>
              <h3 className="text-blue-600 line-clamp-1">{title}</h3>
              <p className="text-sm text-green-700">{value}</p>
              <p className="text-sm text-gray-500 line-clamp-2">
                {description}
              </p>
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="X ( aka twitter )">
            <div>
              <div className="relative">
                <ImageContainer
                  ogImage={ogImage}
                  title={title}
                  className="rounded-xl"
                />
                <h3 className="text-xs max-w-[400px] rounded-md px-2 py-0.5 bg-black line-clamp-1 text-white absolute bottom-3 left-3">
                  {title}
                </h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                From {url ? new URL(url)?.hostname : url}
              </p>
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="Slack">
            <div className="border-l-4 pl-2">
              <div className="py-2">
                <p className="text-sm text-green-700">{value}</p>
                <h3>{title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {description}
                </p>
              </div>
              <ImageContainer
                ogImage={ogImage}
                title={title}
                className="rounded-none"
              />
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="Linkedin">
            <div className="border rounded-md bg-slate-100">
              <div className="border rounded-t-md">
                <ImageContainer
                  ogImage={ogImage}
                  title={title}
                  className="rounded-t-md"
                />
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 dark:text-black">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-black">
                  {url ? new URL(url)?.hostname : url}
                </p>
              </div>
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="Discord">
            <div className="rounded-md bg-slate-100 dark:bg-gray-700 p-4 border-l-4 border-l-gray-400">
              <h3 className="line-clamp-1 text-blue-500">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-white line-clamp-3">
                {description}
              </p>
              <div className="border rounded-t-md mt-3">
                <ImageContainer
                  ogImage={ogImage}
                  title={title}
                  className="rounded-t-md"
                />
              </div>
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="Facebook">
            <div className="border rounded-md bg-slate-100">
              <div className="border rounded-t-md">
                <ImageContainer
                  ogImage={ogImage}
                  title={title}
                  className="rounded-t-md"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-green-700">{value}</p>
                <h3 className="line-clamp-1 dark:text-black">{title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {description}
                </p>
              </div>
            </div>
          </MetaDataContainer>
        </section>
      )}
    </div>
  )
}

export default InputFieldMetadata

function MetaDataContainer({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-gray-500 dark:text-white/70">
        {title}
      </h2>
      {children}
    </div>
  )
}

function ImageContainer({
  ogImage,
  className,
  title,
}: {
  ogImage: string
  className: string
  title: string
}) {
  return ogImage ? (
    <Image
      src={ogImage}
      alt={title}
      width={1000}
      height={500}
      className={cn("", className)}
    />
  ) : (
    <div className="w-[500px] h-[300px] bg-slate-200 grid place-items-center">
      <ImageIcon className="h-10 text-gray-400" />
    </div>
  )
}
