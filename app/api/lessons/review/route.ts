import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import clientPromise from '../../../../util/mongodb';

interface FSRSCard {
  subjectType: 'radical' | 'kanji' | 'vocabulary' | 'kana_vocabulary';
  subjectId: string;
  type: 'meaning' | 'reading';
  card: Card;
}

interface Card {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  last_review?: Date;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const client = await clientPromise;
    const usersDb = client.db('users');

    // Fetch user document
    const userDoc = await usersDb.collection('users').findOne({ username: session.user?.name });

    if (!userDoc || !userDoc.fsrsCards) {
      return NextResponse.json({ message: 'No cards found for user' }, { status: 404 });
    }

    const now = new Date();
    const tenMinutesInMs = 10 * 60 * 1000;  // 10 minutes in milliseconds


    // Filter and sort cards that are due
    const dueCards = userDoc.fsrsCards.filter((fsrsCard: FSRSCard) => {
      const timeDifference = fsrsCard.card.due.getTime() - now.getTime();
      return timeDifference <= 0 || timeDifference <= tenMinutesInMs;
    }).sort((a: FSRSCard, b: FSRSCard) =>
      a.card.due.getTime() - b.card.due.getTime()
    );
    console.log(dueCards.length);
    const totalDueCards = dueCards.length;

    if (totalDueCards === 0) {
      return NextResponse.json({ message: 'No cards due for review', totalDueCards: 0 });
    }

    // Get the next card to review
    const nextCard = dueCards[0];

    // Fetch subject data
    const japaneseDb = client.db('japanese');
    const subjectData = await japaneseDb.collection(nextCard.subjectType).findOne({ id: parseInt(nextCard.subjectId) });

    if (!subjectData) {
      return NextResponse.json({ message: 'Subject data not found' }, { status: 404 });
    }

    // Fetch custom user data
    let customUserData = null;
    switch (nextCard.subjectType) {
      case 'radical':
        customUserData = await usersDb.collection('userRadicalData').findOne({ userId: session.user?.id, radicalId: nextCard.subjectId.toString() });
        break;
      case 'kanji':
        customUserData = await usersDb.collection('userKanjiData').findOne({ userId: session.user?.id, kanjiId: nextCard.subjectId.toString() });
        break;
      case 'vocabulary':
      case 'kana_vocabulary':
        customUserData = await usersDb.collection('userWordData').findOne({ userId: session.user?.id, wordId: nextCard.subjectId.toString() });
        break;
    }

    let omonym = null;

    if (nextCard.subjectType == 'vocabulary') {
      if ('characters' in subjectData.data) {
        omonym = await japaneseDb.collection(nextCard.subjectType).findOne({ 'data.characters': subjectData.data.characters });
      }

    }

    return NextResponse.json({
      nextCard: {
        fsrsCard: nextCard,
        subjectData: subjectData,
        customUserData: customUserData,
        omonym: omonym,
      },
      totalDueCards: totalDueCards
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}