import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { emitPeopleEvidence } from "../people/evidence.js";

export const trainingRouter: Router = Router();
trainingRouter.use(authorizeResource("training:read", "training:write"));

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["all", "active", "overdue", "completed"]).optional(),
});

const idParams = z.object({
  id: z.string().min(1),
});

const trainingType = z.enum(["security_awareness", "compliance", "phishing_simulation", "custom"]);

const trainingFrequency = z.enum(["once", "monthly", "quarterly", "annually"]);

const trainingCreateBody = z.object({
  title: z.string().min(1),
  type: trainingType,
  description: z.string().optional().nullable(),
  frequency: trainingFrequency.optional(),
  isRequired: z.boolean().optional(),
  content: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

const trainingPatchBody = trainingCreateBody.partial();

// --- Stats ---
trainingRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const now = new Date();

    const [totalPrograms, completions, overduePrograms, programs, allCompletions, quizAttempts] =
      await Promise.all([
        db.trainingProgram.count(),
        db.trainingCompletion.groupBy({
          by: ["status"],
          _count: { id: true },
        }),
        db.trainingProgram.count({
          where: { dueDate: { lt: now } },
        }),
        db.trainingProgram.findMany({
          select: { type: true, frequency: true, createdAt: true },
        }),
        db.trainingCompletion.findMany({
          select: { status: true, score: true, completedAt: true, assignedAt: true },
        }),
        db.quizAttempt.findMany({
          select: { passed: true, percentage: true, completedAt: true },
        }),
      ]);

    const statusCounts: Record<string, number> = {};
    let totalCompletions = 0;
    let completedCount = 0;
    for (const row of completions) {
      statusCounts[row.status] = row._count.id;
      totalCompletions += row._count.id;
      if (row.status === "completed") completedCount = row._count.id;
    }

    const overallCompletionRate =
      totalCompletions > 0 ? Math.round((completedCount / totalCompletions) * 100) : 0;

    // By training type
    const byType: Record<string, number> = {};
    const byFrequency: Record<string, number> = {};
    for (const p of programs) {
      byType[p.type] = (byType[p.type] || 0) + 1;
      byFrequency[p.frequency] = (byFrequency[p.frequency] || 0) + 1;
    }

    // Monthly completion trend (last 12 months)
    const monthlyCompletions: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = allCompletions.filter(
        (c) => c.completedAt && c.completedAt >= start && c.completedAt < end,
      ).length;
      monthlyCompletions.push({ month: label, count });
    }

    // Average score of completed trainings
    const scores = allCompletions
      .filter((c) => c.status === "completed" && c.score != null)
      .map((c) => c.score!);
    const avgScore =
      scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

    // Quiz results
    const completedAttempts = quizAttempts.filter((a) => a.completedAt != null);
    const quizPassedCount = completedAttempts.filter((a) => a.passed === true).length;
    const quizFailedCount = completedAttempts.filter((a) => a.passed === false).length;
    const quizPercentages = completedAttempts
      .filter((a) => a.percentage != null)
      .map((a) => a.percentage!);
    const avgQuizScore =
      quizPercentages.length > 0
        ? Math.round(quizPercentages.reduce((s, v) => s + v, 0) / quizPercentages.length)
        : null;

    res.json({
      success: true,
      data: {
        totalPrograms,
        overallCompletionRate,
        overduePrograms,
        totalAssigned: totalCompletions,
        completedCount,
        byStatus: statusCounts,
        byType,
        byFrequency,
        monthlyCompletions,
        avgScore,
        quizResults: {
          totalAttempts: completedAttempts.length,
          passed: quizPassedCount,
          failed: quizFailedCount,
          avgScore: avgQuizScore,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- List programs (with search, filter, enrichment) ---
trainingRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { page, limit, search, type, status } = paginationQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Record<string, unknown> = {};
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (type && type !== "all") {
      where.type = type;
    }
    if (status === "overdue") {
      where.dueDate = { lt: now };
    }

    const [items, total] = await Promise.all([
      db.trainingProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          completions: {
            select: { id: true, status: true },
          },
        },
      }),
      db.trainingProgram.count({ where }),
    ]);

    const enriched = items.map((p: any) => {
      const totalAssigned = p.completions.length;
      const completedCount = p.completions.filter((c: any) => c.status === "completed").length;
      const completionRate =
        totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
      const isOverdue = p.dueDate && new Date(p.dueDate) < now;
      const { completions: _, ...rest } = p;
      return {
        ...rest,
        totalAssigned,
        completedCount,
        completionRate,
        isOverdue,
      };
    });

    if (status === "completed") {
      const filtered = enriched.filter((p: any) => p.completionRate === 100);
      res.json({
        success: true,
        data: {
          items: filtered,
          page,
          limit,
          total: filtered.length,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: { items: enriched, page, limit, total },
    });
  } catch (err) {
    next(err);
  }
});

// --- Get single program with completions ---
trainingRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const program = await db.trainingProgram.findUnique({
      where: { id },
      include: {
        completions: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { assignedAt: "desc" },
        },
      },
    });
    if (!program) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    res.json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
});

// --- Create program ---
trainingRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = trainingCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const program = await db.trainingProgram.create({
      data: { ...body, tenantId },
    });
    res.status(201).json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
});

// --- Update program ---
trainingRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = trainingPatchBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const program = await db.trainingProgram.update({
      where: { id },
      data: body,
    });
    res.json({ success: true, data: program });
  } catch (err) {
    next(err);
  }
});

// --- Delete program ---
trainingRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.trainingProgram.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// --- Assign users to a program ---
trainingRouter.post("/:id/assign", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const { userIds } = z.object({ userIds: z.array(z.string().min(1)).min(1) }).parse(req.body);
    const db = prismaWithTenant(tenantId);

    const program = await db.trainingProgram.findUnique({ where: { id } });
    if (!program) {
      res.status(404).json({ success: false, error: "Program not found" });
      return;
    }

    const existing = await db.trainingCompletion.findMany({
      where: { trainingProgramId: id, userId: { in: userIds } },
      select: { userId: true },
    });
    const existingSet = new Set(existing.map((e: any) => e.userId));
    const newUserIds = userIds.filter((uid: string) => !existingSet.has(uid));

    if (newUserIds.length > 0) {
      await db.trainingCompletion.createMany({
        data: newUserIds.map((userId: string) => ({
          trainingProgramId: id,
          userId,
          tenantId,
          status: "assigned" as const,
        })),
      });

      const frequencyMap: Record<string, string> = {
        once: "once",
        monthly: "monthly",
        quarterly: "quarterly",
        annually: "annually",
      };
      const taskFrequency = frequencyMap[program.frequency] || "annually";
      const isRecurring = taskFrequency !== "once";

      const nextDue =
        isRecurring && program.dueDate
          ? computeNextTrainingDue(program.dueDate, taskFrequency)
          : null;

      await db.task.createMany({
        data: newUserIds.map((userId: string) => ({
          tenantId,
          title: `Complete: ${program.title}`,
          description: program.description,
          type: isRecurring ? ("recurring" as const) : ("manual" as const),
          status: "pending" as const,
          priority: program.isRequired ? ("high" as const) : ("medium" as const),
          assigneeId: userId,
          sourceModule: "training" as const,
          sourceId: id,
          dueDate: program.dueDate,
          frequency: taskFrequency as any,
          nextDueDate: nextDue,
        })),
      });
    }

    const completions = await db.trainingCompletion.findMany({
      where: { trainingProgramId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ success: true, data: completions });
  } catch (err) {
    next(err);
  }
});

function computeNextTrainingDue(currentDue: Date, frequency: string): Date {
  const next = new Date(currentDue);
  switch (frequency) {
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// --- Update a completion status ---
trainingRouter.patch("/:id/completions/:completionId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { completionId } = z.object({ completionId: z.string().min(1) }).parse(req.params);
    const body = z
      .object({
        status: z.enum(["assigned", "in_progress", "completed", "overdue"]),
        score: z.number().int().min(0).max(100).optional().nullable(),
      })
      .parse(req.body);

    const db = prismaWithTenant(tenantId);
    const data: Record<string, unknown> = { status: body.status };
    if (body.score !== undefined) data.score = body.score;
    if (body.status === "completed") data.completedAt = new Date();

    const completion = await db.trainingCompletion.update({
      where: { id: completionId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        trainingProgram: { select: { title: true } },
      },
    });

    // Advisory evidence (ISO A.6.3 / SOC 2 CC1.4) when a training is completed.
    // Deduped per completion id by the shared evidence writer, so re-marking is
    // safe. Best-effort — never blocks the response.
    if (body.status === "completed") {
      void emitPeopleEvidence(tenantId, "training_completed", {
        title: `Security training completed: ${completion.trainingProgram.title}`,
        description: `${completion.user.name} completed "${completion.trainingProgram.title}".`,
        sourceId: completionId,
      }).catch((err) => console.error("[training] advisory evidence failed:", err));
    }

    res.json({ success: true, data: completion });
  } catch (err) {
    next(err);
  }
});

// --- Remove a completion (unassign) ---
trainingRouter.delete("/:id/completions/:completionId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { completionId } = z.object({ completionId: z.string().min(1) }).parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.trainingCompletion.delete({ where: { id: completionId } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// Quiz endpoints — nested under /training/:programId/quizzes
// =====================================================================

const questionType = z.enum(["multiple_choice", "true_false", "multi_select"]);

const quizCreateBody = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  passingScore: z.number().int().min(0).max(100).optional(),
  timeLimitMinutes: z.number().int().min(1).optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
});

const questionBody = z.object({
  text: z.string().min(1),
  type: questionType.optional(),
  sortOrder: z.number().int().optional(),
  points: z.number().int().min(1).optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(2),
});

const fullQuizBody = quizCreateBody.extend({
  questions: z.array(questionBody).min(1),
});

// --- List quizzes for a program ---
trainingRouter.get("/:id/quizzes", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const quizzes = await db.trainingQuiz.findMany({
      where: { trainingProgramId: id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });

    res.json({ success: true, data: quizzes });
  } catch (err) {
    next(err);
  }
});

// --- Get single quiz with questions and options ---
trainingRouter.get("/:id/quizzes/:quizId", async (req, res, next) => {
  try {
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);
    const db = prismaWithTenant((req as any).auth.tenantId);

    const quiz = await db.trainingQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: { orderBy: { sortOrder: "asc" } },
          },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, error: "Quiz not found" });
      return;
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// --- Create quiz with questions + options in one call ---
trainingRouter.post("/:id/quizzes", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = fullQuizBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const quiz = await db.trainingQuiz.create({
      data: {
        trainingProgramId: id,
        tenantId,
        title: body.title,
        description: body.description ?? null,
        passingScore: body.passingScore ?? 70,
        timeLimitMinutes: body.timeLimitMinutes ?? null,
        shuffleQuestions: body.shuffleQuestions ?? false,
        questions: {
          create: body.questions.map((q, qi) => ({
            text: q.text,
            type: q.type ?? "multiple_choice",
            sortOrder: q.sortOrder ?? qi,
            points: q.points ?? 1,
            options: {
              create: q.options.map((o, oi) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                sortOrder: o.sortOrder ?? oi,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// --- Update quiz metadata ---
trainingRouter.patch("/:id/quizzes/:quizId", async (req, res, next) => {
  try {
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);
    const body = quizCreateBody
      .partial()
      .extend({
        isPublished: z.boolean().optional(),
      })
      .parse(req.body);
    const db = prismaWithTenant((req as any).auth.tenantId);

    const quiz = await db.trainingQuiz.update({
      where: { id: quizId },
      data: body,
    });
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// --- Replace all questions for a quiz (full overwrite) ---
trainingRouter.put("/:id/quizzes/:quizId/questions", async (req, res, next) => {
  try {
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);
    const { questions } = z.object({ questions: z.array(questionBody).min(1) }).parse(req.body);
    const db = prismaWithTenant((req as any).auth.tenantId);

    await db.quizQuestion.deleteMany({ where: { quizId } });

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi]!;
      await db.quizQuestion.create({
        data: {
          quizId,
          text: q.text,
          type: q.type ?? "multiple_choice",
          sortOrder: q.sortOrder ?? qi,
          points: q.points ?? 1,
          options: {
            create: q.options.map((o, oi) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              sortOrder: o.sortOrder ?? oi,
            })),
          },
        },
      });
    }

    const updated = await db.trainingQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// --- Delete quiz ---
trainingRouter.delete("/:id/quizzes/:quizId", async (req, res, next) => {
  try {
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);
    const db = prismaWithTenant((req as any).auth.tenantId);
    await db.trainingQuiz.delete({ where: { id: quizId } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// --- Get quiz for taking (hides correct answers) ---
trainingRouter.get("/:id/quizzes/:quizId/take", async (req, res, next) => {
  try {
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);
    const db = prismaWithTenant((req as any).auth.tenantId);

    const quiz = await db.trainingQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, text: true, sortOrder: true },
            },
          },
        },
      },
    });

    if (!quiz || !quiz.isPublished) {
      res.status(404).json({ success: false, error: "Quiz not available" });
      return;
    }

    const questions = quiz.shuffleQuestions
      ? quiz.questions.sort(() => Math.random() - 0.5)
      : quiz.questions;

    res.json({
      success: true,
      data: { ...quiz, questions },
    });
  } catch (err) {
    next(err);
  }
});

// --- Submit quiz attempt ---
trainingRouter.post("/:id/quizzes/:quizId/submit", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id: programId } = idParams.parse(req.params);
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);

    const { answers } = z
      .object({
        answers: z.array(
          z.object({
            questionId: z.string().min(1),
            optionId: z.string().min(1),
          }),
        ),
      })
      .parse(req.body);

    const db = prismaWithTenant(tenantId);

    const quiz = await db.trainingQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, error: "Quiz not found" });
      return;
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    const answerRecords: { questionId: string; optionId: string; isCorrect: boolean }[] = [];

    for (const q of quiz.questions) {
      totalPoints += q.points;
      const submitted = answers.find((a) => a.questionId === q.id);
      if (submitted) {
        const selectedOption = q.options.find((o) => o.id === submitted.optionId);
        const correct = selectedOption?.isCorrect ?? false;
        if (correct) earnedPoints += q.points;
        answerRecords.push({
          questionId: q.id,
          optionId: submitted.optionId,
          isCorrect: correct,
        });
      } else {
        answerRecords.push({
          questionId: q.id,
          optionId: "",
          isCorrect: false,
        });
      }
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const attempt = await db.quizAttempt.create({
      data: {
        quizId,
        userId,
        tenantId,
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        completedAt: new Date(),
        answers: {
          create: answerRecords
            .filter((a) => a.optionId)
            .map((a) => ({
              questionId: a.questionId,
              optionId: a.optionId,
              isCorrect: a.isCorrect,
            })),
        },
      },
      include: {
        answers: {
          include: {
            question: { select: { id: true, text: true, points: true } },
            option: { select: { id: true, text: true } },
          },
        },
      },
    });

    if (passed) {
      await db.trainingCompletion.updateMany({
        where: {
          trainingProgramId: programId,
          userId,
          status: { not: "completed" },
        },
        data: {
          status: "completed",
          score: percentage,
          completedAt: new Date(),
        },
      });
    } else {
      await db.trainingCompletion.updateMany({
        where: {
          trainingProgramId: programId,
          userId,
          status: "assigned",
        },
        data: { status: "in_progress" },
      });
    }

    res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    next(err);
  }
});

// --- Get user's attempts for a quiz ---
trainingRouter.get("/:id/quizzes/:quizId/attempts", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { quizId } = z.object({ quizId: z.string().min(1) }).parse(req.params);
    const db = prismaWithTenant(tenantId);

    const attempts = await db.quizAttempt.findMany({
      where: { quizId },
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: attempts });
  } catch (err) {
    next(err);
  }
});
