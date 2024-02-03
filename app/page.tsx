export default function Home() {
  return (
    <section className="flex justify-center flex-col items-center">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <main className="flex justify-center flex-col items-center w-full h-[92vh] dark:bg-background">
        <h1 className="text-2xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-br from-primary/40 via-primary to-primary/40">
          Check Your Sitemap <br />
          and Metadata here
        </h1>
      </main>
    </section>
  )
}
