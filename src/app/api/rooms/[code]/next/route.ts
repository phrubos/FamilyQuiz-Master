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

  if (hasNext) {
    const nextQ = room.questions[room.currentQuestionIndex];
    const category = categories.find(c => c.questions.some(q => q.id === nextQ.id));

    // Wait 4 seconds before showing next question (optimized from 8s)
    // (2s to see correct answer + 2s transition)
    setTimeout(async () => {
      setQuestionStartTime(code);
      
      const currentRound = room.rounds[room.currentRoundIndex];
      
      await pusherServer.trigger(getGameChannel(code), 'question-shown', {
        question: {
          ...nextQ,
          categoryName: category?.name,
          isBonus: category?.isBonus || false,
        },
        questionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        roundInfo: {
            current: room.currentRoundIndex + 1,
            total: room.rounds.length,
            name: currentRound.name,
            type: currentRound.type
        },
        // FÁZIS 4: Server timestamp for timer sync
        serverTime: Date.now(),
        timeLimit: room.settings.timeLimit
      });
    }, 4000);

    return NextResponse.json({ success: true, gameEnded: false });
  } else {
    // Check if we entered voting phase
    if (room.status === 'voting' && room.votingState) {
        setTimeout(async () => {
            await pusherServer.trigger(getGameChannel(code), 'voting-started', {
                categories: room.votingState!.options.map(id => ({
                    id,
                    name: CATEGORY_META[id]?.name || id,
                    icon: CATEGORY_META[id]?.icon || '🎲',
                    color: CATEGORY_META[id]?.color || '#ffffff'
                })),
                duration: 10000,
                endTime: room.votingState!.endTime
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
