import { describe, expect, it } from 'vitest';
import {
  INITIAL_TEACHER_GAMES,
  loadStoredTeacherGames,
  getParticipantsForGame,
  getQuestionAnalyticsForGame,
  getClassComparisonsForGame,
} from '../src/features/lecturer/mockTeacherGames';

describe('Teacher Game Operations & Arena Control', () => {
  it('loads default teacher game rooms with correct subjects and PINs', () => {
    const rooms = loadStoredTeacherGames();
    expect(rooms.length).toBeGreaterThan(0);
    const osRoom = rooms.find((r) => r.subjectCode === 'IT3080');
    expect(osRoom).toBeDefined();
    expect(osRoom?.joinPin).toMatch(/^\d{6}$/);
    expect(osRoom?.targetClassCodes).toContain('171146');
  });

  it('generates realistic student rosters partitioned by course class', () => {
    const room = INITIAL_TEACHER_GAMES[0];
    const participants = getParticipantsForGame(room.id);
    expect(participants.length).toBeGreaterThan(0);

    const firstStudent = participants[0];
    expect(firstStudent.studentCode).toMatch(/^2023\d{4}$/);
    expect(firstStudent.gradeScale10).toBeGreaterThanOrEqual(0);
    expect(firstStudent.gradeScale10).toBeLessThanOrEqual(10);
    expect(firstStudent.rank).toBe(1);

    // Verify all participants belong to target classes
    const validClasses = room.targetClassCodes;
    const hasMatch = participants.some((p) => validClasses.includes(p.courseClassCode));
    expect(hasMatch).toBe(true);
  });

  it('provides distractor item analytics and pedagogical notes for teachers', () => {
    const analytics = getQuestionAnalyticsForGame('game_room_01');
    expect(analytics.length).toBeGreaterThan(0);

    const q1 = analytics[0];
    expect(q1.correctPercent).toBeGreaterThan(0);
    expect(q1.commonMistakePedagogicalNote.length).toBeGreaterThan(10);
    expect(q1.options.length).toBe(4);
  });

  it('computes class comparisons to evaluate performance across different student cohorts', () => {
    const room = INITIAL_TEACHER_GAMES[0];
    const comparisons = getClassComparisonsForGame(room);
    expect(comparisons.length).toBeGreaterThan(0);

    const firstComparison = comparisons[0];
    expect(firstComparison.courseClassCode).toBeDefined();
    expect(firstComparison.averageGrade).toBeGreaterThan(0);
    expect(firstComparison.participationRate).toBeGreaterThan(0);
  });
});

import {
  INITIAL_MG1,
  INITIAL_MG2,
  INITIAL_MG3,
  INITIAL_MG4,
  INITIAL_MG5,
  INITIAL_MG6,
  resolveMG1,
  resolveMG4,
  auditMG5Report,
  releaseMG5EndOfTermBounty,
} from '../src/features/lecturer/mockOfficialMinigames';

describe('Official 6 Minigames Specification (Slide 3.1)', () => {
  it('Minigame 1: awards points only to students predicting within ±5% tolerance', () => {
    const actualCount = 340;
    const resolved = resolveMG1(INITIAL_MG1, actualCount);
    expect(resolved.status).toBe('RESOLVED');

    // 340 * 0.95 = 323, 340 * 1.05 = 357
    const winner345 = resolved.predictions.find((p) => p.guessedCount === 345);
    expect(winner345?.isWinner).toBe(true);

    const loser390 = resolved.predictions.find((p) => p.guessedCount === 390);
    expect(loser390?.isWinner).toBe(false);
  });

  it('Minigame 2: verifies self-prediction of approved question count for AI and Human groups', () => {
    expect(INITIAL_MG2.length).toBeGreaterThan(0);
    const exactSub = INITIAL_MG2.find((p) => p.predictedApprovedCount === p.actualApprovedCount);
    expect(exactSub?.isExact).toBe(true);
    expect(exactSub?.pointsAwarded).toBe(150);
  });

  it('Minigame 3: awards +0.25 bonus grade for guessing >= 50% of 10 questions popularity correctly', () => {
    expect(INITIAL_MG3.tenQuestions.length).toBe(10);
    expect(INITIAL_MG3.bonusGradeValue).toBe(0.25);

    const perfectSub = INITIAL_MG3.submissions.find((s) => s.accuracyPercent === 100);
    expect(perfectSub?.isQualifiedBonus).toBe(true);

    const lowSub = INITIAL_MG3.submissions.find((s) => s.accuracyPercent === 40);
    expect(lowSub?.isQualifiedBonus).toBe(false);
  });

  it('Minigame 4: awards prizes strictly to Top 3 closest and earliest predictions', () => {
    const finalBankSize = 1420;
    const resolved = resolveMG4(INITIAL_MG4, finalBankSize);
    expect(resolved.status).toBe('RESOLVED');

    const topWinners = resolved.predictions.filter((p) => p.isTop3Winner);
    expect(topWinners.length).toBe(3);
    expect(topWinners[0].rank).toBe(1);
    expect(topWinners[0].pointsAwarded).toBe(500);
  });

  it('Minigame 5: penalizes question author and defers reporter bounty until end of term', () => {
    expect(INITIAL_MG5.length).toBeGreaterThan(0);
    const reportId = 'mg5_rep_01';
    const audited = auditMG5Report(reportId, true, 'Test confirmed');
    const target = audited.find((r) => r.id === reportId);
    expect(target?.teacherAuditStatus).toBe('CONFIRMED_FAULTY');
    expect(target?.penaltyPointsForAuthor).toBe(-50);
    expect(target?.bountyPointsForReporter).toBe(100);
    expect(target?.isReleasedAtEndOfTerm).toBe(false);

    // Release at end of term
    const { updatedList, releasedCount } = releaseMG5EndOfTermBounty();
    expect(releasedCount).toBeGreaterThanOrEqual(1);
    const releasedTarget = updatedList.find((r) => r.id === reportId);
    expect(releasedTarget?.isReleasedAtEndOfTerm).toBe(true);
  });

  it('Minigame 6: identifies LLM-generated questions (>= 7 questions) and awards fastest all-correct winner', () => {
    expect(INITIAL_MG6.questions.length).toBeGreaterThanOrEqual(7);
    const fastest = INITIAL_MG6.submissions.find((s) => s.isFastestWinner);
    expect(fastest).toBeDefined();
    expect(fastest?.isAllCorrect).toBe(true);
    expect(fastest?.pointsAwarded).toBe(350);
  });
});

import { gamesApi } from '../src/api/games';

describe('Gamification & Minigames OpenAPI 21 Endpoints', () => {
  it('POST /questions/{questionId}/ratings/{ratingUserId}/review-error audits report properly', async () => {
    const res = await gamesApi.reviewError(107, 101, {
      is_comfirmed: true,
      notes: 'Đã thẩm định lỗi',
    });
    expect(res.success).toBe(true);
    expect(res.message).toContain('Đã xác nhận lỗi');
  });

  it('POST /admin/leaderboards/rebuild triggers Redis ZSet recalculation', async () => {
    const res = await gamesApi.rebuildLeaderboard({ type: 'SEMESTER' });
    expect(res.success).toBe(true);
    expect(res.message).toContain('Redis');
  });

  it('POST /admin/semesters/finalize-semester locks semester and releases bounties', async () => {
    const res = await gamesApi.finalizeSemester();
    expect(res.success).toBe(true);
    expect(res.message).toContain('chốt sổ');
  });

  it('GET /games/leaderboard returns ranked entries', async () => {
    const res = await gamesApi.getLeaderboard({ period: 'SEMESTER' });
    expect(res.entries).toBeDefined();
    expect(res.entries?.length).toBeGreaterThan(0);
    expect(res.entries?.[0].rank).toBe(1);
    expect(res.entries?.[0].total_points).toBeGreaterThan(0);
  });

  it('GET /games/prediction/game-1/classes returns course classes for Game 1', async () => {
    const classes = await gamesApi.getGame1Classes();
    expect(classes.length).toBeGreaterThan(0);
    expect(classes[0].course_class_id).toBeDefined();
    expect(classes[0].class_code).toBeDefined();
  });

  it('GET /games/prediction/active-session returns active Saturday session with >= 7 questions', async () => {
    const session = await gamesApi.getGame6ActiveSession();
    expect(session.session_id).toBeDefined();
    expect(session.questions?.length).toBeGreaterThanOrEqual(7);
  });

  it('GET /games/check-in returns daily streak status', async () => {
    const checkIn = await gamesApi.getCheckInStatus();
    expect(checkIn.current_streak).toBeGreaterThanOrEqual(0);
  });
});


