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
  const radicalId = searchParams.get('radicalId')

  if (!radicalId) {
    return NextResponse.json({ message: 'Radical ID is required' }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const database = client.db('users')
    const userRadicalData = await database.collection('userRadicalData').findOne({
      userId: session.user.id,
      radicalId: radicalId
    })

    if (userRadicalData) {
      return NextResponse.json({
        synonyms: userRadicalData.synonyms || [],
        mnemonic: userRadicalData.mnemonic || ''
      })
    } else {
      return NextResponse.json({ synonyms: [], mnemonic: '' })
    }
  } catch (error) {
    console.error('Error fetching user radical data:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { radicalId, synonyms, mnemonic } = await request.json()

  if (!radicalId) {
    return NextResponse.json({ message: 'Radical ID is required' }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const database = client.db('users')
    await database.collection('userRadicalData').updateOne(
      { userId: session.user.id, radicalId: radicalId },
      { $set: { synonyms, mnemonic } },
      { upsert: true }
    )

    return NextResponse.json({ message: 'User radical data updated successfully' })
  } catch (error) {
    console.error('Error updating user radical data:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}