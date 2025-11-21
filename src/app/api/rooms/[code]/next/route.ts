import { NextResponse } from 'next/server';
import { nextQuestion, getRoom, calculateQuestionResults, getLeaderboard, setQuestionStartTime, getGameStats } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';
import { categories } from '@/data/questions';
import { CATEGORY_META } from '@/types/game';

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

  // Calculate results for current question
  const { results, achievements } = calculateQuestionResults(code);
  const currentQuestion = room.questions[room.currentQuestionIndex];

  // Send results
  await pusherServer.trigger(getGameChannel(code), 'question-ended', {
    correctAnswer: currentQuestion?.correct ?? 0, // Safety check
    results,
    leaderboard: getLeaderboard(code),
    achievements,
  });

  // Send achievement events
  for (const achievement of achievements) {
    await pusherServer.trigger(getGameChannel(code), 'achievement-earned', achievement);
  }

  // Move to next question
  const hasNext = nextQuestion(code);

  // Get fresh room state after nextQuestion modified it
  const updatedRoom = getRoom(code);
  if (!updatedRoom) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  if (hasNext) {
    const nextQ = updatedRoom.questions[updatedRoom.currentQuestionIndex];
    const category = categories.find(c => c.questions.some(q => q.id === nextQ.id));

    // Wait 4 seconds before showing next question (optimized from 8s)
    // (2s to see correct answer + 2s transition)
    setTimeout(async () => {
      setQuestionStartTime(code);

      const currentRound = updatedRoom.rounds[updatedRoom.currentRoundIndex];

      await pusherServer.trigger(getGameChannel(code), 'question-shown', {
        question: {
          ...nextQ,
          categoryName: category?.name,
          isBonus: category?.isBonus || false,
        },
        questionIndex: updatedRoom.currentQuestionIndex,
        totalQuestions: updatedRoom.questions.length,
        roundInfo: {
            current: updatedRoom.currentRoundIndex + 1,
            total: updatedRoom.rounds.length,
            name: currentRound.name,
            type: currentRound.type
        },
        // FÁZIS 4: Server timestamp for timer sync
        serverTime: Date.now(),
        timeLimit: updatedRoom.settings.timeLimit
      });
    }, 4000);

    return NextResponse.json({ success: true, gameEnded: false });
  } else {
    // Check if we entered voting phase
    if (updatedRoom.status === 'voting' && updatedRoom.votingState) {
        setTimeout(async () => {
            await pusherServer.trigger(getGameChannel(code), 'voting-started', {
                categories: updatedRoom.votingState!.options.map(id => ({
                    id,
                    name: CATEGORY_META[id]?.name || id,
                    icon: CATEGORY_META[id]?.icon || '🎲',
                    color: CATEGORY_META[id]?.color || '#ffffff'
                })),
                duration: 10000,
                endTime: updatedRoom.votingState!.endTime
            });
        }, 4000);
        return NextResponse.json({ success: true, voting: true });
    }

    // Game ended
    const stats = getGameStats(code);
    await pusherServer.trigger(getGameChannel(code), 'game-ended', {
      leaderboard: getLeaderboard(code),
      stats,
    });

    return NextResponse.json({ success: true, gameEnded: true });
  }
}
