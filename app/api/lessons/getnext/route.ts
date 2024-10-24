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
  const count = parseInt(n);

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

    if (lessonsToReturn === 0) {
      return NextResponse.json({ subjects: [], total: 0 });
    }

    const collections = ['kana_vocabulary', 'kanji', 'radical', 'vocabulary'];
    
    // Check if user has completed all lessons at current level
    let maxLessonPosition = 0;
    for (const collection of collections) {
      const maxPositionResult = await db.collection(collection)
        .find({ 'data.level': userLevel })
        .sort({ 'data.lesson_position': -1 })
        .limit(1)
        .toArray();

      if (maxPositionResult.length > 0) {
        maxLessonPosition = Math.max(maxLessonPosition, maxPositionResult[0].data.lesson_position);
      }
    }

    // If user has completed all lessons, increment level and reset lastLessonPosition
    if (lastLessonPosition >= maxLessonPosition) {
      userLevel++;
      lastLessonPosition = -1;
      await usersDb.collection('users').updateOne(
        { username: session.user?.name },
        { $set: { level: userLevel, lastLessonPosition: lastLessonPosition } }
      );
    }

    let allLessons: any = [];
    for (const collection of collections) {
      const lessons = await db.collection(collection)
        .find({
          'data.level': userLevel,
          'data.lesson_position': { $gt: lastLessonPosition }
        })
        .sort({ 'data.lesson_position': 1 })
        .toArray();
     
      allLessons = allLessons.concat(lessons.map(lesson => ({...lesson, collection})));
    }

    allLessons.sort((a: any, b: any) => a.data.lesson_position - b.data.lesson_position);
    const nextLessons = allLessons.slice(0, lessonsToReturn);

    // Calculate the total remaining lessons for today
    const remainingLessons = maximumLessonsPerDay - lessonsRequestedToday;

    return NextResponse.json({
      subjects: nextLessons,
      total: remainingLessons
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}