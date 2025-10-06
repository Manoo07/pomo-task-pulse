// src/routes/tasks-swagger.js
const express = require("express");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(500).required(),
  description: Joi.string().max(2000).optional(),
  track_id: Joi.string().uuid().optional(),
  priority: Joi.string().valid("none", "low", "medium", "high").default("none"),
  estimated_pomodoros: Joi.number().min(0.25).max(10).default(1.0),
  for_date: Joi.date()
    .iso()
    .default(() => new Date().toISOString().split("T")[0]),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(500),
  description: Joi.string().max(2000),
  track_id: Joi.string().uuid(),
  priority: Joi.string().valid("none", "low", "medium", "high"),
  estimated_pomodoros: Joi.number().min(0.25).max(10),
  status: Joi.string().valid("todo", "doing", "done"),
  order_index: Joi.number().integer().min(0),
  completed: Joi.boolean(),
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get user's tasks with filtering and pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, doing, done]
 *         description: Filter by task status
 *       - in: query
 *         name: track_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by learning track ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
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
 *         description: Tasks retrieved successfully
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
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
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
    const { status, track_id, date, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      userId: req.user.id,
    };

    if (status) where.status = status;
    if (track_id) where.trackId = track_id;
    if (date) {
      where.forDate = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          track: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 example: Implement user authentication
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Add JWT-based authentication system
 *               track_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               priority:
 *                 type: string
 *                 enum: [none, low, medium, high]
 *                 example: high
 *               estimated_pomodoros:
 *                 type: number
 *                 minimum: 0.25
 *                 maximum: 10
 *                 example: 3.0
 *               for_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-01
 *     responses:
 *       201:
 *         description: Task created successfully
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
 *                   example: Task created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Learning track not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post("/", async (req, res) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      title,
      description,
      track_id,
      priority,
      estimated_pomodoros,
      for_date,
    } = value;

    // Verify track belongs to user if provided
    if (track_id) {
      const track = await prisma.learningTrack.findFirst({
        where: {
          id: track_id,
          userId: req.user.id,
        },
      });

      if (!track) {
        return res.status(404).json({
          success: false,
          message: "Learning track not found",
        });
      }
    }

    // Get next order index
    const lastTask = await prisma.task.findFirst({
      where: {
        userId: req.user.id,
        forDate: new Date(for_date),
      },
      orderBy: { orderIndex: "desc" },
    });

    const orderIndex = lastTask ? lastTask.orderIndex + 1 : 0;

    // Create task
    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        trackId: track_id,
        title,
        description,
        priority,
        estimatedPomodoros: estimated_pomodoros,
        forDate: new Date(for_date),
        orderIndex,
      },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               track_id:
 *                 type: string
 *                 format: uuid
 *               priority:
 *                 type: string
 *                 enum: [none, low, medium, high]
 *               estimated_pomodoros:
 *                 type: number
 *                 minimum: 0.25
 *                 maximum: 10
 *               status:
 *                 type: string
 *                 enum: [todo, doing, done]
 *               order_index:
 *                 type: integer
 *                 minimum: 0
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                   example: Task updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTaskSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Verify track belongs to user if provided
    if (value.track_id) {
      const track = await prisma.learningTrack.findFirst({
        where: {
          id: value.track_id,
          userId: req.user.id,
        },
      });

      if (!track) {
        return res.status(404).json({
          success: false,
          message: "Learning track not found",
        });
      }
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...value,
        updatedAt: new Date(),
      },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   put:
 *     summary: Update task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, doing, done]
 *                 example: doing
 *     responses:
 *       200:
 *         description: Task status updated successfully
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
 *                   example: Task status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid status
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
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["todo", "doing", "done"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be todo, doing, or done",
      });
    }

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // If moving to 'doing', move other 'doing' tasks to 'todo'
    if (status === "doing") {
      await prisma.task.updateMany({
        where: {
          userId: req.user.id,
          status: "doing",
          id: { not: id },
        },
        data: {
          status: "todo",
          updatedAt: new Date(),
        },
      });
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
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
 *                   example: Task deleted successfully
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Delete task
    await prisma.task.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
