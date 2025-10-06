// src/routes/sessions-swagger.js
const express = require("express");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Validation schemas
const createSessionSchema = Joi.object({
  task_id: Joi.string().uuid().optional(),
  mode: Joi.string().valid("pomodoro", "shortBreak", "longBreak").required(),
});

const completeSessionSchema = Joi.object({
  ended_at: Joi.date().iso().required(),
  completed: Joi.boolean().default(true),
});

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Start a new Pomodoro session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               task_id:
 *                 type: string
 *                 format: uuid
 *                 description: Associated task ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               mode:
 *                 type: string
 *                 enum: [pomodoro, shortBreak, longBreak]
 *                 example: pomodoro
 *     responses:
 *       201:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Session started successfully
 *                 data:
 *                   $ref: '#/components/schemas/Session'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post("/", async (req, res) => {
  try {
    const { error, value } = createSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { task_id, mode } = value;

    // Verify task belongs to user if provided
    if (task_id) {
      const task = await prisma.task.findFirst({
        where: {
          id: task_id,
          userId: req.user.id,
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }
    }

    // Get user settings for duration
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    let durationSeconds;
    switch (mode) {
      case "pomodoro":
        durationSeconds = (settings?.pomodoroDuration || 25) * 60;
        break;
      case "shortBreak":
        durationSeconds = (settings?.shortBreakDuration || 5) * 60;
        break;
      case "longBreak":
        durationSeconds = (settings?.longBreakDuration || 15) * 60;
        break;
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: req.user.id,
        taskId: task_id,
        mode,
        startedAt: new Date(),
        durationSeconds,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            track: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Session started successfully",
      data: session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/sessions/{id}/complete:
 *   put:
 *     summary: Complete a Pomodoro session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ended_at
 *             properties:
 *               ended_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-01T10:25:00Z
 *               completed:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: Session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Session completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Session'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.put("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = completeSessionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { ended_at, completed } = value;

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        task: true,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        endedAt: new Date(ended_at),
        completed,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            track: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Update task completed pomodoros if it's a pomodoro session
    if (session.mode === "pomodoro" && session.taskId && completed) {
      await prisma.task.update({
        where: { id: session.taskId },
        data: {
          completedPomodoros: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      });
    }

    // Update user stats
    await prisma.userStats.upsert({
      where: { userId: req.user.id },
      update: {
        totalPomodoros: {
          increment: session.mode === "pomodoro" && completed ? 1 : 0,
        },
        totalFocusTime: {
          increment: session.mode === "pomodoro" ? session.durationSeconds : 0,
        },
        totalBreakTime: {
          increment: session.mode !== "pomodoro" ? session.durationSeconds : 0,
        },
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        totalPomodoros: session.mode === "pomodoro" && completed ? 1 : 0,
        totalFocusTime:
          session.mode === "pomodoro" ? session.durationSeconds : 0,
        totalBreakTime:
          session.mode !== "pomodoro" ? session.durationSeconds : 0,
        lastActivityDate: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Session completed successfully",
      data: updatedSession,
    });
  } catch (error) {
    console.error("Complete session error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get user's session history
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [pomodoro, shortBreak, longBreak]
 *         description: Filter by session mode
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Session'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         pages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get("/", async (req, res) => {
  try {
    const { date_from, date_to, mode, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      userId: req.user.id,
    };

    if (mode) where.mode = mode;
    if (date_from || date_to) {
      where.startedAt = {};
      if (date_from) where.startedAt.gte = new Date(date_from);
      if (date_to) where.startedAt.lte = new Date(date_to);
    }

    // Get sessions with pagination
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              track: {
                select: {
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take,
      }),
      prisma.session.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
