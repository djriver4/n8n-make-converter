import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function GET() {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
    const fileInfos = files.map((filename) => {
      const filePath = path.join(UPLOAD_DIR, filename)
      const stats = fs.statSync(filePath)
      return {
        id: path.parse(filename).name,
        name: filename,
        size: stats.size,
        uploadDate: stats.mtime.toISOString(),
      }
    })
    return NextResponse.json(fileInfos)
  } catch (error) {
    console.error("Error reading files:", error)
    return NextResponse.json({ error: "Failed to read files" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${uuidv4()}${path.extname(file.name)}`
  const filepath = path.join(UPLOAD_DIR, filename)

  try {
    fs.writeFileSync(filepath, buffer)
    return NextResponse.json({ message: "File uploaded successfully", filename })
  } catch (error) {
    console.error("Error saving file:", error)
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
  }
}

