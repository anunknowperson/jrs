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
  const kanjiId = searchParams.get('kanjiId')
  if (!kanjiId) {
    return NextResponse.json({ message: 'Kanji ID is required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const database = client.db('users')
    const userKanjiData = await database.collection('userKanjiData').findOne({
      userId: session.user.id,
      kanjiId: kanjiId
    })
    if (userKanjiData) {
      return NextResponse.json({
        synonyms: userKanjiData.synonyms || [],
        meaningMnemonic: userKanjiData.meaningMnemonic || '',
        readingMnemonic: userKanjiData.readingMnemonic || ''
      })
    } else {
      return NextResponse.json({ synonyms: [], meaningMnemonic: '', readingMnemonic: '' })
    }
  } catch (error) {
    console.error('Error fetching user kanji data:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}


export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { kanjiId, synonyms, meaningMnemonic, readingMnemonic } = await request.json()
  if (!kanjiId) {
    return NextResponse.json({ message: 'Kanji ID is required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const database = client.db('users')

    // Define type for updateFields
    type UpdateFields = {
      synonyms?: string[];
      meaningMnemonic?: string;
      readingMnemonic?: string;
    };

    // Create an object with only the fields that are provided in the request
    const updateFields: UpdateFields = {};
    if (synonyms !== undefined) updateFields.synonyms = synonyms;
    if (meaningMnemonic !== undefined) updateFields.meaningMnemonic = meaningMnemonic;
    if (readingMnemonic !== undefined) updateFields.readingMnemonic = readingMnemonic;


    await database.collection('userKanjiData').updateOne(
      { userId: session.user.id, kanjiId: kanjiId },
      { $set: updateFields },
      { upsert: true }
    )
    return NextResponse.json({ message: 'User kanji data updated successfully' })
  } catch (error) {
    console.error('Error updating user kanji data:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}