import type { MDXComponents } from "mdx/types"
import Link from "next/link"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1 className="mb-6 mt-0 text-title font-semibold sm:text-display" {...props} />
    ),
    h2: (props) => (
      <h2 className="mb-3 mt-10 text-heading font-semibold" {...props} />
    ),
    h3: (props) => (
      <h3 className="mb-2 mt-8 text-subhead font-semibold" {...props} />
    ),
    p: (props) => (
      <p className="mb-4 leading-relaxed text-muted-foreground" {...props} />
    ),
    ul: (props) => (
      <ul
        className="mb-4 list-disc space-y-2 pl-5 text-muted-foreground"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="mb-4 list-decimal space-y-2 pl-5 text-muted-foreground"
        {...props}
      />
    ),
    li: (props) => <li className="leading-relaxed" {...props} />,
    a: ({ href, ...props }) => {
      if (href?.startsWith("/")) {
        return (
          <Link
            href={href}
            className="text-link underline underline-offset-2"
            {...props}
          />
        )
      }
      return (
        <a
          href={href}
          className="text-link underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      )
    },
    blockquote: (props) => (
      <blockquote
        className="my-6 border-l-2 border-border-strong pl-4 italic text-muted-foreground"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm"
        {...props}
      />
    ),
    ...components,
  }
}
