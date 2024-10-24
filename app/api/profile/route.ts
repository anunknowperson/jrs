import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/auth';
import clientPromise from '../../../util/mongodb';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('users');

    const user = await db.collection('users').findOne({ username: session.user.name });


    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        maximumLessonsPerDay: user.maximumLessonsPerDay,
        lessonsPerSession: user.lessonsPerSession
    });
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('users');

    const { maximumLessonsPerDay, lessonsPerSession } = await request.json();

    const result = await db.collection('users').updateOne(
        { username: session.user.name },
        { $set: { maximumLessonsPerDay, lessonsPerSession } }
    );

    if (result.modifiedCount === 1) {
        return NextResponse.json({ message: 'Profile updated successfully' });
    } else {
        return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }
}