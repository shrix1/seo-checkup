import type { MDXComponents } from "mdx/types"
import Link from "next/link"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="text-3xl sm:text-4xl font-bold tracking-tight font-mono mt-0 mb-6"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="text-xl sm:text-2xl font-semibold tracking-tight mt-10 mb-3"
        {...props}
      />
    ),
    h3: (props) => (
      <h3 className="text-lg font-semibold mt-8 mb-2" {...props} />
    ),
    p: (props) => (
      <p className="text-muted-foreground leading-relaxed mb-4" {...props} />
    ),
    ul: (props) => (
      <ul className="list-disc pl-5 space-y-2 mb-4 text-muted-foreground" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal pl-5 space-y-2 mb-4 text-muted-foreground" {...props} />
    ),
    li: (props) => <li className="leading-relaxed" {...props} />,
    a: ({ href, ...props }) => {
      if (href?.startsWith("/")) {
        return (
          <Link
            href={href}
            className="underline underline-offset-2 text-foreground"
            {...props}
          />
        )
      }
      return (
        <a
          href={href}
          className="underline underline-offset-2 text-foreground"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      )
    },
    blockquote: (props) => (
      <blockquote
        className="border-l-2 border-foreground/30 pl-4 italic text-muted-foreground my-6"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded"
        {...props}
      />
    ),
    ...components,
  }
}
