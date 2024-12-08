import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import clientPromise from '../../../../util/mongodb';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const n = searchParams.get('n') || '5';
  const count = parseInt(n, 10);

  try {
    const client = await clientPromise;
    const db = client.db('japanese');
    const usersDb = client.db('users');

    const user = await usersDb.collection('users').findOne({ username: session.user?.name });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let userLevel = user.level || 1;
    let lastLessonPosition = user.lastLessonPosition || -1;
    const maximumLessonsPerDay = user.maximumLessonsPerDay || 15;

    // Get today's date in user's timezone (assuming UTC for simplicity)
    const today = new Date().toISOString().split('T')[0];

    // Check how many lessons have been requested today
    const lessonsRequestedToday = user.lessonsRequestedToday?.date === today
      ? user.lessonsRequestedToday.count
      : 0;

    // Calculate how many lessons can be returned
    const availableLessons = maximumLessonsPerDay - lessonsRequestedToday;
    const lessonsToReturn = Math.min(count, availableLessons);
    console.log(availableLessons);
    if (lessonsToReturn === 0) {
      return NextResponse.json({ subjects: [], total: 0 });
    }

    const collections = ['radical', 'kanji', 'vocabulary', 'kana_vocabulary'];

    // Retrieve ALL subjects for the current userLevel across all collections
    let allLessons: any[] = [];
    for (const collection of collections) {
      const lessons = await db
        .collection(collection)
        .find({ 'data.level': userLevel })
        .toArray();
      
      // Tag each lesson with its collection name
      allLessons = allLessons.concat(lessons.map((lesson: any) => ({ ...lesson, collection })));
    }

    // Sort all lessons by lesson_position
    allLessons.sort((a, b) => a.data.lesson_position - b.data.lesson_position);

    // Determine the start and end index for the next lessons
    const startIndex = lastLessonPosition + 1;
    const endIndex = startIndex + lessonsToReturn;

    console.log(startIndex);
	console.log(endIndex);


    // Slice the next lessons
    const nextLessons = allLessons.slice(startIndex, endIndex);

    return NextResponse.json({
      subjects: nextLessons,
      total: availableLessons
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
