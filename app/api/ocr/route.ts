import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    if (!process.env.REPLICATE_OCR_MODEL) {
      return NextResponse.json(
        { error: 'Replicate OCR model not configured' },
        { status: 500 }
      )
    }

    // Convert file to base64 data URI
    const bytes = await imageFile.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type || 'image/png'
    const dataUri = `data:${mimeType};base64,${base64}`

    const output = (await replicate.run(
      process.env.REPLICATE_OCR_MODEL as `${string}/${string}:${string}`,
      {
        input: {
          image: dataUri,
          task: 'ocr',
          max_tokens: 1024,
        },
      }
    )) as { text: string; confidence: string }

    return NextResponse.json({
      text: output.text,
      confidence: output.confidence,
    })
  } catch (error) {
    console.error('OCR API error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
