"use client"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Loader, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { postDiscordLogs } from "@/lib/discord-webhook"

const InputFieldMetadata = ({ query }: { query: string }) => {
  const router = useRouter()
  const [value, setValue] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ogImage, setOgImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [url, setUrl] = useState("")

  useEffect(() => {
    const q = decodeURIComponent(query)
    setValue(q || "https://exemplary.ai")
  }, [query])

  useEffect(() => {
    ;(async () => {
      await handleSubmit()
    })()
  }, [])

  useEffect(() => {
    if (value) {
      router.push(`/metadata?q=${encodeURIComponent(value)}`)
    }
  }, [value])

  async function handleSubmit() {
    try {
      setLoading(true)
      const data = await fetch(`/api/v1?q=${decodeURIComponent(query)}`)
      const jsonData = await data.json()
      await postDiscordLogs(decodeURIComponent(query), "METADATA")

      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = jsonData

      const title = tempDiv.querySelector("title")?.textContent
      setTitle(title || "Untitled")

      const description = tempDiv
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")

      setDescription(description || "Untitled")

      const ogImageUrl = tempDiv
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content")
      setOgImage(ogImageUrl || "")

      setUrl(value)
    } catch (error) {
      console.error("Error fetching metadata:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-center flex-col items-center">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleSubmit()
        }}
        className="w-[400px] flex justify-center my-6 items-center h-[60px] sticky top-4 rounded-lg"
      >
        <Input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          type="text"
          autoFocus
          placeholder="yoursite.com"
          className="text-base h-[50px] dark:bg-white font-mono text-white dark:text-black bg-black"
        />
      </form>

      {error && (
        <div className="px-6 flex items-center justify-center mt-4 w-[400px] gap-4 py-5 bg-teal-100 text-teal-600 rounded-lg">
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
          <MetaDataContainer title="google">
            <div>
              <h3 className="text-blue-600 line-clamp-1">{title}</h3>
              <p className="text-sm text-green-700">{value}</p>
              <p className="text-sm text-gray-500 line-clamp-2">
                {description}
              </p>
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="twitter">
            <div className="">
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

          <MetaDataContainer title="slack">
            <div className="border-l-4 pl-2">
              <div className="py-2">
                <p className="text-sm text-green-700">{value}</p>
                <h3>{title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {description}
                </p>
              </div>
              <div>
                <ImageContainer
                  ogImage={ogImage}
                  title={title}
                  className="rounded-none"
                />
              </div>
            </div>
          </MetaDataContainer>

          <MetaDataContainer title="linkedin">
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

          <MetaDataContainer title="facebook">
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
      <h2 className="text-sm capitalize font-medium text-gray-500 dark:text-white/70">
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
