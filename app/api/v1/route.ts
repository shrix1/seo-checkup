import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const value = req.url.split("q=")[1]

  try {
    const data = await fetch(value)

    if (!data.ok) {
      console.error("Failed to fetch data:", data.statusText)
      return NextResponse.json({
        error: "Failed to fetch data",
        status: data.status,
      })
    }

    const res = await data.text()
    console.log(res)

    return NextResponse.json(res)
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Error fetching data", status: 500 })
  }
}
