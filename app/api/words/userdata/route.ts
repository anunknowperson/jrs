import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import clientPromise from '../../../../util/mongodb'
import { authOptions } from '../../auth/[...nextauth]/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const wordId = searchParams.get('wordId')
  if (!wordId) {
    return NextResponse.json({ message: 'Word ID is required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const database = client.db('users')
    const userWordData = await database.collection('userWordData').findOne({
      userId: session.user.id,
      wordId: wordId
    })
    if (userWordData) {
      return NextResponse.json({
        synonyms: userWordData.synonyms || [],
        meaningMnemonic: userWordData.meaningMnemonic || '',
        readingMnemonic: userWordData.readingMnemonic || ''
      })
    } else {
      return NextResponse.json({ synonyms: [], meaningMnemonic: '', readingMnemonic: '' })
    }
  } catch (error) {
    console.error('Error fetching user word data:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { wordId, synonyms, meaningMnemonic, readingMnemonic } = await request.json()
  if (!wordId) {
    return NextResponse.json({ message: 'Word ID is required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const database = client.db('users')

    type UpdateFields = {
      synonyms?: string[];
      meaningMnemonic?: string;
      readingMnemonic?: string;
    };

    // Create an object with only the fields that are provided in the request
    const updateFields :UpdateFields = {}
    if (synonyms !== undefined) updateFields.synonyms = synonyms
    if (meaningMnemonic !== undefined) updateFields.meaningMnemonic = meaningMnemonic
    if (readingMnemonic !== undefined) updateFields.readingMnemonic = readingMnemonic

    await database.collection('userWordData').updateOne(
      { userId: session.user.id, wordId: wordId },
      { $set: updateFields },
      { upsert: true }
    )
    return NextResponse.json({ message: 'User word data updated successfully' })
  } catch (error) {
    console.error('Error updating user word data:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}