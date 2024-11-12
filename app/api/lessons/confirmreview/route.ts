import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/auth';
import clientPromise from '../../../../util/mongodb';
import { createEmptyCard, formatDate, fsrs, generatorParameters, Rating } from 'ts-fsrs';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const result = searchParams.get('result');

  if (!id || !type || !['meaning', 'reading'].includes(type) || !['good', 'bad'].includes(result!)) {
    
    return NextResponse.json({ message: 'Invalid query parameters' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const usersDb = client.db('users');

    // Fetch user document
    const userDoc = await usersDb.collection('users').findOne({ username: session.user?.name });
    
    
    if (!userDoc || !userDoc.fsrsCards) {
      return NextResponse.json({ message: 'No cards found for user' }, { status: 404 });
    }

    // Find the corresponding FSRSCard
    const fsrsCard = userDoc.fsrsCards.find(
      (card :any) => card.subjectId === parseInt(id) && card.type === type
    );
    console.log(fsrsCard);
    if (!fsrsCard) {
      return NextResponse.json({ message: 'Card not found' }, { status: 404 });
    }

    // Load FSRS object with parameters from user db
    const params = generatorParameters(userDoc.fsrsParameters);
    const f = fsrs(params);

    // Reschedule card based on result
    const rating = result === 'good' ? Rating.Good : Rating.Again;
    
    const now = new Date();
    const card = fsrsCard.card;
    const schedulingCards = f.repeat(card, now);

    const { card: newCard } = schedulingCards[rating];

    console.log(newCard);

    // Update the user's fsrsCards
    const updatedCards = userDoc.fsrsCards.map((card :any) =>
      card.subjectId === parseInt(id) && card.type === type ? { ...card, card: newCard } : card
    );

    await usersDb.collection('users').updateOne(
      { username: session.user?.name },
      { $set: { fsrsCards: updatedCards } }
    );

    return NextResponse.json({ message: 'Card rescheduled successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
