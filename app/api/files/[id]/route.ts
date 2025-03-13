import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const filename = `${params.id}.json`
  const filepath = path.join(UPLOAD_DIR, filename)

  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(filepath)
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Disposition": `attachment; filename=${filename}`,
      "Content-Type": "application/json",
    },
  })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const filename = `${params.id}.json`
  const filepath = path.join(UPLOAD_DIR, filename)

  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  try {
    fs.unlinkSync(filepath)
    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

