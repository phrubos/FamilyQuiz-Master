import { NextResponse } from 'next/server';
import { startGame, getRoom } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { hostId } = await request.json();

  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  if (room.hostId !== hostId) {
    return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
  }

  const success = startGame(code);
  if (!success) {
    return NextResponse.json({ error: 'Nem sikerült elindítani a játékot' }, { status: 400 });
  }

  const currentQuestion = room.questions[0];

  // Notify all players
  await pusherServer.trigger(getGameChannel(code), 'game-started', {
    question: {
      id: currentQuestion.id,
      question: currentQuestion.question,
      answers: currentQuestion.answers,
    },
    questionIndex: 0,
    totalQuestions: room.questions.length,
  });

  return NextResponse.json({ success: true });
}
