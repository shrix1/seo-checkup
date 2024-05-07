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
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      <main className="flex justify-center flex-col items-center w-full h-screen md:h-[83vh]">
        <h1 className="text-4xl md:text-7xl -mt-10 font-bold text-center bg-clip-text text-transparent bg-gradient-to-br from-primary/40 via-primary to-primary/40">
          Check Your Sitemap <br />
          and Metadata here
        </h1>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 px-4 md:px-0">
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
