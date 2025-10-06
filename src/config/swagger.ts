// src/config/swagger.ts
import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pomofocus Backend API",
      version: "1.0.0",
      description:
        "A comprehensive Pomodoro productivity app backend API with user management, task tracking, learning tracks, session management, and analytics.",
      contact: {
        name: "API Support",
        email: "support@pomofocus.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
      {
        url: "https://api.pomofocus.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            avatarUrl: { type: "string", nullable: true },
            timezone: { type: "string" },
            emailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            priority: {
              type: "string",
              enum: ["none", "low", "medium", "high"],
            },
            estimatedPomodoros: { type: "number" },
            completedPomodoros: { type: "integer" },
            status: { type: "string", enum: ["todo", "doing", "done"] },
            trackId: { type: "string", format: "uuid", nullable: true },
            userId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Session: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            mode: {
              type: "string",
              enum: ["pomodoro", "shortBreak", "longBreak"],
            },
            startedAt: { type: "string", format: "date-time" },
            endedAt: { type: "string", format: "date-time", nullable: true },
            durationSeconds: { type: "integer" },
            completed: { type: "boolean" },
            taskId: { type: "string", format: "uuid", nullable: true },
            userId: { type: "string", format: "uuid" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" },
            error: { type: "string", nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // Path to the API files
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Pomofocus API Documentation",
    })
  );

  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};
