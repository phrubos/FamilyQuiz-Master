import { NextResponse } from 'next/server';
import { getRoom, getLeaderboard } from '@/lib/gameStore';
import { categories } from '@/data/questions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = getRoom(code);

  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  const currentQuestion = room.questions[room.currentQuestionIndex];
  const category = currentQuestion
    ? categories.find(c => c.questions.some(q => q.id === currentQuestion.id))
    : null;

  return NextResponse.json({
    code: room.code,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isConnected: p.isConnected,
    })),
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    currentQuestion: room.status === 'playing' ? {
      id: currentQuestion?.id,
      question: currentQuestion?.question,
      answers: currentQuestion?.answers,
      categoryName: category?.name,
      isBonus: category?.isBonus || false,
    } : null,
    leaderboard: getLeaderboard(code),
    settings: room.settings,
  });
}
