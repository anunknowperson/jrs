import { NextResponse } from 'next/server'
import clientPromise from '../../../../util/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const client = await clientPromise
    const database = client.db('users')
    const usersCollection = database.collection('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username })
    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    await usersCollection.insertOne({
      username,
      password: hashedPassword,
      maximumLessonsPerDay: 15,
      lessonsPerSession: 5,
    })

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 })
  }
}