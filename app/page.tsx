import ToolCard from "@/components/tool-card"

export default function Home() {
  const tools = [
    {
      id: 1,
      title: "Sitemap Link Checker",
      content: "Easily review your sitemap by adding yoursite.com/sitemap.xml.",
      link: "/sitemap?q=https://exemplary.ai/sitemap.xml",
    },
    {
      id: 2,
      title: "Metadata viewer",
      content: "Easily review your metadata by adding your site link.",
      link: "/metadata?q=https://exemplary.ai",
    },
  ]

  return (
    <section className="flex justify-center flex-col items-center">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <main className="flex justify-center flex-col items-center w-full h-[81vh]">
        <h1 className="text-2xl md:text-7xl -mt-10 font-bold text-center bg-clip-text text-transparent bg-gradient-to-br from-primary/40 via-primary to-primary/40">
          Check Your Sitemap <br />
          and Metadata here
        </h1>

        <section className="grid grid-cols-2 gap-4 mt-10">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              content={tool.content}
              link={tool.link}
            />
          ))}
        </section>
      </main>
    </section>
  )
}
