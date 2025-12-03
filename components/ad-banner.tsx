
import Link from "next/link"
import { Badge } from "./ui/badge"

const AdBanner = () => {
  return (
    <Link
      href="https://supwriter.com"
      target="_blank"
      rel="noopener"
      className="block w-full bg-black dark:bg-white transition-colors py-1.5 text-center text-sm"
    >
      <span className="text-white dark:text-black"># AD : </span>
      <span className="text-white dark:text-black">Try </span>
      <span className="text-white dark:text-black font-bold underline underline-offset-2">Supwriter.com</span>
      <span className="text-white dark:text-black"> — AI humanizer that outsmarts all AI detectors <Badge variant="secondary">100K+ users | 50% off</Badge></span>
    </Link>
  )
}

export default AdBanner
