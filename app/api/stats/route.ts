import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/auth';
import clientPromise from '../../../util/mongodb';

export async function GET(request: NextRequest) {
  // Ensure user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  // Extract subjectId from query parameters
  const searchParams = request.nextUrl.searchParams;
  const subjectIdStr = searchParams.get('subjectId');
  if (!subjectIdStr) {
    return NextResponse.json({ message: 'subjectId is required' }, { status: 400 });
  }
  
  const subjectId = parseInt(subjectIdStr, 10);
  if (isNaN(subjectId)) {
    return NextResponse.json({ message: 'subjectId must be a number' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const usersDb = client.db('users');

    // Retrieve the user document from the database
    const user = await usersDb
      .collection('users')
      .findOne({ username: session.user?.name });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // fsrsCards is an array of objects like:
    // fsrsCards: [
    //   {
    //     subjectType: "radical",
    //     subjectId: 6,
    //     type: "meaning",
    //     card: {
    //       reps: 6
    //     }
    //   }, ...
    // ]
    const fsrsCards = user.fsrsCards || [];

    // Find the first object that matches the given subjectId
    const matchedCard = fsrsCards.find((card: any) => card.subjectId === subjectId);

    // If no card is found, return 0
    const reps = matchedCard ? matchedCard.card?.reps || 0 : 0;

    return NextResponse.json({ reps });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
