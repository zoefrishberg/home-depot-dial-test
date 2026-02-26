import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { v4 as uuidv4 } from "npm:uuid";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-640b0dec/health", (c) => {
  return c.json({ status: "ok" });
});

// Create a new respondent session
app.post("/make-server-640b0dec/session/create", async (c) => {
  try {
    const sessionId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const sessionData = {
      sessionId,
      createdAt: timestamp,
      status: "active",
      pages: {
        intro: { completed: false },
        tutorial: { completed: false },
        dialTest: { completed: false }
      }
    };
    
    await kv.set(`session:${sessionId}`, sessionData);
    
    return c.json({ 
      success: true, 
      sessionId,
      message: "Session created successfully" 
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return c.json({ 
      success: false, 
      error: `Failed to create session: ${error}` 
    }, 500);
  }
});

// Record page completion
app.post("/make-server-640b0dec/session/:sessionId/page", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { pageName } = await c.req.json();
    
    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ 
        success: false, 
        error: "Session not found" 
      }, 404);
    }
    
    session.pages[pageName] = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    await kv.set(`session:${sessionId}`, session);
    
    return c.json({ 
      success: true,
      message: `Page ${pageName} recorded` 
    });
  } catch (error) {
    console.error("Error recording page completion:", error);
    return c.json({ 
      success: false, 
      error: `Failed to record page: ${error}` 
    }, 500);
  }
});

// Save dial test data points (batch)
app.post("/make-server-640b0dec/session/:sessionId/dialdata", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { pageType, dataPoints } = await c.req.json();
    
    // pageType: "tutorial" or "actual"
    // dataPoints: array of { timestamp, button, intensity }
    
    const dataKey = `dialdata:${sessionId}:${pageType}`;
    const existingData = await kv.get(dataKey) || { dataPoints: [] };
    
    existingData.dataPoints.push(...dataPoints);
    existingData.lastUpdated = new Date().toISOString();
    
    await kv.set(dataKey, existingData);
    
    return c.json({ 
      success: true,
      message: `Saved ${dataPoints.length} data points`,
      totalPoints: existingData.dataPoints.length
    });
  } catch (error) {
    console.error("Error saving dial data:", error);
    return c.json({ 
      success: false, 
      error: `Failed to save dial data: ${error}` 
    }, 500);
  }
});

// Save feedback responses
app.post("/make-server-640b0dec/session/:sessionId/feedback", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const feedback = await c.req.json();

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({
        success: false,
        error: "Session not found while saving feedback"
      }, 404);
    }

    await kv.set(`feedback:${sessionId}`, {
      ...feedback,
      savedAt: new Date().toISOString(),
    });

    // Mark feedback as completed in session
    session.pages.feedback = {
      completed: true,
      completedAt: new Date().toISOString(),
    };
    await kv.set(`session:${sessionId}`, session);

    return c.json({
      success: true,
      message: "Feedback saved successfully",
    });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return c.json({
      success: false,
      error: `Failed to save feedback: ${error}`,
    }, 500);
  }
});

// Get session data (for debugging/analysis)
app.get("/make-server-640b0dec/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ 
        success: false, 
        error: "Session not found" 
      }, 404);
    }
    
    const tutorialData = await kv.get(`dialdata:${sessionId}:tutorial`);
    const actualData = await kv.get(`dialdata:${sessionId}:actual`);
    
    return c.json({ 
      success: true,
      session,
      dialData: {
        tutorial: tutorialData,
        actual: actualData
      }
    });
  } catch (error) {
    console.error("Error retrieving session:", error);
    return c.json({ 
      success: false, 
      error: `Failed to retrieve session: ${error}` 
    }, 500);
  }
});

Deno.serve(app.fetch);