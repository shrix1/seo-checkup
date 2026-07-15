declare module "*.mdx" {
  import type { MDXProps } from "mdx/types"
  const MDXComponent: (props: MDXProps) => JSX.Element
  export default MDXComponent
}
