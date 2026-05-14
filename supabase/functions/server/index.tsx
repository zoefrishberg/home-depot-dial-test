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
    const body = await c.req.json();
    const variant = body?.variant || "unknown";
    const deviceInfo = body?.deviceInfo || null;
    const urlParams = body?.urlParams || null;
    
    const sessionData = {
      sessionId,
      createdAt: timestamp,
      status: "active",
      variant, // Store A/B test variant
      deviceInfo, // Store device type, platform, browser, screen size, etc.
      urlParams, // Store all URL parameters from survey provider
      pages: {
        intro: { completed: false },
        tutorial: { completed: false },
        dialTest: { completed: false }
      }
    };
    
    await kv.set(`session:${sessionId}`, sessionData);
    
    console.log(`Session created: ${sessionId}, Variant: ${variant}, Device: ${deviceInfo?.deviceType || 'unknown'} (${deviceInfo?.platform || 'unknown'}), URL Params: ${Object.keys(urlParams || {}).length} params`);
    
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
    const { pageName, pageData } = await c.req.json();
    
    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ 
        success: false, 
        error: "Session not found" 
      }, 404);
    }
    
    session.pages[pageName] = {
      completed: true,
      completedAt: new Date().toISOString(),
      ...(pageData || {}),
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
    
    // pageType: "tutorial" or "actual" (or "video" for slider variant)
    // dataPoints: array of { timestamp, button, intensity }
    
    // Get the session to retrieve the variant
    const session = await kv.get(`session:${sessionId}`);
    const variant = session?.variant || "unknown";
    
    const dataKey = `dialdata:${sessionId}:${pageType}`;
    const existingData = await kv.get(dataKey) || { dataPoints: [] };
    
    existingData.dataPoints.push(...dataPoints);
    existingData.lastUpdated = new Date().toISOString();
    existingData.variant = variant; // Store variant with the data
    
    await kv.set(dataKey, existingData);
    
    console.log(`Saved ${dataPoints.length} dial data points for session ${sessionId} (${variant} variant, ${pageType})`);
    
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
    
    // Get all possible dial data keys (tutorial, actual, video)
    const tutorialData = await kv.get(`dialdata:${sessionId}:tutorial`);
    const actualData = await kv.get(`dialdata:${sessionId}:actual`);
    const videoData = await kv.get(`dialdata:${sessionId}:video`);
    const feedbackData = await kv.get(`feedback:${sessionId}`);
    
    return c.json({ 
      success: true,
      session,
      dialData: {
        tutorial: tutorialData,
        actual: actualData || videoData, // Handle both pageType names
      },
      feedback: feedbackData
    });
  } catch (error) {
    console.error("Error retrieving session:", error);
    return c.json({ 
      success: false, 
      error: `Failed to retrieve session: ${error}` 
    }, 500);
  }
});

// Get all sessions (for analysis/export)
app.get("/make-server-640b0dec/sessions/all", async (c) => {
  try {
    // Get all session keys
    const sessionKeys = await kv.getByPrefix("session:");
    
    if (!sessionKeys || sessionKeys.length === 0) {
      return c.json({
        success: true,
        sessions: [],
        count: 0,
        message: "No sessions found"
      });
    }
    
    // Enrich each session with its associated data
    const enrichedSessions = await Promise.all(
      sessionKeys.map(async (session: any) => {
        const sessionId = session.sessionId;
        
        // Get dial data
        const tutorialData = await kv.get(`dialdata:${sessionId}:tutorial`);
        const actualData = await kv.get(`dialdata:${sessionId}:actual`);
        const videoData = await kv.get(`dialdata:${sessionId}:video`);
        const feedbackData = await kv.get(`feedback:${sessionId}`);
        
        return {
          session,
          dialData: {
            tutorial: tutorialData,
            actual: actualData || videoData,
          },
          feedback: feedbackData
        };
      })
    );
    
    return c.json({
      success: true,
      sessions: enrichedSessions,
      count: enrichedSessions.length
    });
  } catch (error) {
    console.error("Error retrieving all sessions:", error);
    return c.json({
      success: false,
      error: `Failed to retrieve sessions: ${error}`
    }, 500);
  }
});

Deno.serve(app.fetch);