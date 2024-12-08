import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import clientPromise from '../../../../util/mongodb';
import { createEmptyCard, FSRSParameters, Card } from 'ts-fsrs';

interface LearnedSubject {
  id: string;
  lessonPosition: number;
}

interface FSRSCard {
  subjectType: string;
  subjectId: string;
  type: 'meaning' | 'reading';
  card: Card;
}

interface UserDocument {
  username: string;
  fsrsParameters?: FSRSParameters;
  lastLessonPosition?: number;
  lessonsRequestedToday?: { date: string; count: number };
  lessonsPerSession?: number;
  fsrsCards?: FSRSCard[];
  level?: number;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { learnedSubjects } = body;
  if (!Array.isArray(learnedSubjects) || learnedSubjects.length === 0) {
    return NextResponse.json({ message: 'Invalid learnedSubjects' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const usersDb = client.db('users');
    const japaneseDb = client.db('japanese');

    // Fetch user document
    const userDoc = await usersDb.collection<UserDocument>('users').findOne({ username: session.user?.name });
    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userLevel = userDoc.level || 1;

    const defaultParameters: FSRSParameters = {
      request_retention: 0.9,
      maximum_interval: 36500,
      w: [0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0234,1.616,0.1544,1.0824,1.9813,0.0953,0.2975,2.2042,0.2407,2.9466,0.5034,0.6567],
      enable_fuzz: false,
      enable_short_term: true,
    };

    // Create or retrieve FSRS parameters
    let fsrsParameters: FSRSParameters = userDoc.fsrsParameters || defaultParameters;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const newFsrsCards: FSRSCard[] = [];
    const tables = ['kana_vocabulary', 'kanji', 'radical', 'vocabulary'];

    for (const subject of learnedSubjects) {
      // Check all four tables for the subject
      let subjectData = null;
      let subjectType = '';
      for (const table of tables) {
        subjectData = await japaneseDb.collection(table).findOne({ id: parseInt(subject.id) });
        if (subjectData) {
          subjectType = table;
          break;
        }
      }
      if (!subjectData) {
        console.error(`Subject with id ${subject.id} not found in any table`);
        continue;
      }

      // Create 'meaning' card for all subject types
      const meaningCard: FSRSCard = {
        subjectType: subjectType,
        subjectId: subject.id,
        type: 'meaning',
        card: createEmptyCard(now)
      };
      newFsrsCards.push(meaningCard);

      // Create 'reading' card for non-radical, non-kana_vocabulary subjects
      if (subjectType !== 'radical' && subjectType !== 'kana_vocabulary') {
        const readingCard: FSRSCard = {
          subjectType: subjectType,
          subjectId: subject.id,
          type: 'reading',
          card: createEmptyCard(now)
        };
        newFsrsCards.push(readingCard);
      }
    }

    // Calculate new lessons requested today count
    const currentLessonsRequestedToday = userDoc.lessonsRequestedToday?.date === today
      ? userDoc.lessonsRequestedToday.count
      : 0;
    const newLessonsRequestedToday = currentLessonsRequestedToday + (userDoc.lessonsPerSession || 0);

    // Increment lastLessonPosition by the number of submitted lessons (not by max of lessonPosition)
    const learnedCount = learnedSubjects.length;
    let lastLessonPosition = (userDoc.lastLessonPosition ?? -1) + learnedCount;

    // Check if user has completed all lessons at current level
    // To do that, find the max lesson_position at this level across all collections
    let maxLessonPosition = -1;
    for (const collection of tables) {
      const maxPositionResult = await japaneseDb.collection(collection)
        .find({ 'data.level': userLevel })
        .sort({ 'data.lesson_position': -1 })
        .limit(1)
        .toArray();

      if (maxPositionResult.length > 0) {
        const pos = maxPositionResult[0].data.lesson_position;
        if (pos > maxLessonPosition) {
          maxLessonPosition = pos;
        }
      }
    }

    // If user has completed all lessons at current level, increment level and reset lastLessonPosition
    let newUserLevel = userLevel;
    if (lastLessonPosition >= maxLessonPosition && maxLessonPosition !== -1) {
      newUserLevel++;
      lastLessonPosition = -1;
    }

    // Update user document
    await usersDb.collection<UserDocument>('users').updateOne(
      { username: session.user.name! },
      {
        $set: {
          level: newUserLevel,
          lastLessonPosition: lastLessonPosition,
          fsrsParameters: fsrsParameters,
          lessonsRequestedToday: { date: today, count: newLessonsRequestedToday }
        },
        $push: {
          fsrsCards: { $each: newFsrsCards }
        }
      }
    );

    return NextResponse.json({ message: 'Level, lesson position, FSRS cards, and lessons requested today updated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
