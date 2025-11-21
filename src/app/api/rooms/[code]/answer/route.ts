import { NextResponse } from 'next/server';
import { submitAnswer, getRoom } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, answerIndex, answerValue } = await request.json();

  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  if (room.status !== 'playing') {
    return NextResponse.json({ error: 'A játék nem fut' }, { status: 400 });
  }

  const currentQuestion = room.questions[room.currentQuestionIndex];
  if (!currentQuestion) {
    return NextResponse.json({ error: 'Nincs aktuális kérdés' }, { status: 400 });
  }

  const success = submitAnswer(code, {
    playerId,
    questionId: currentQuestion.id,
    answerIndex,
    answerValue,
    timestamp: Date.now(),
  });

  if (!success) {
    return NextResponse.json({ error: 'Már válaszoltál erre a kérdésre' }, { status: 400 });
  }

  // Notify host about answer
  await pusherServer.trigger(getGameChannel(code), 'answer-received', {
    playerId,
    answeredCount: room.answers.filter(a => a.questionId === currentQuestion.id).length,
    totalPlayers: room.players.length,
  });

  return NextResponse.json({ success: true });
}
