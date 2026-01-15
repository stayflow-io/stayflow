import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const folder = searchParams.get('folder') || 'uploads'

    if (!filename) {
      return NextResponse.json({ error: 'Filename obrigatorio' }, { status: 400 })
    }

    const body = request.body
    if (!body) {
      return NextResponse.json({ error: 'Arquivo obrigatorio' }, { status: 400 })
    }

    // Gerar nome unico para evitar conflitos
    const timestamp = Date.now()
    const uniqueFilename = `${folder}/${timestamp}-${filename}`

    const blob = await put(uniqueFilename, body, {
      access: 'public',
    })

    return NextResponse.json(blob)
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
