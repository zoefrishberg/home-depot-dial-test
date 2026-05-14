# Data Access & Analysis Guide

## Overview
This document describes how to access and analyze data collected from the NELSurveys dial test application.

## Session Data Structure

Each survey session stores the following information:

### Session Metadata
```typescript
{
  sessionId: string,           // Unique UUID for this session
  createdAt: string,           // ISO timestamp
  status: "active",
  variant: "buttons" | "slider", // A/B test variant
  deviceInfo: {
    deviceType: "mobile" | "tablet" | "desktop",
    platform: "ios" | "android" | "windows" | "macos" | "linux" | "unknown",
    browser: string,           // e.g., "Chrome", "Safari", "Firefox"
    userAgent: string,         // Full user agent string
    screenWidth: number,       // Screen width in pixels
    screenHeight: number,      // Screen height in pixels
    touchSupport: boolean      // Whether device has touch capability
  },
  pages: {
    intro: { completed: boolean, completedAt?: string },
    firstExposure: { completed: boolean, completedAt?: string },
    howItWorks: { completed: boolean, completedAt?: string },
    handSelection: {
      completed: boolean,
      completedAt?: string,
      handedness?: "left" | "right"
    },
    tutorial: {
      completed: boolean,
      completedAt?: string,
      durationMs?: number,
      durationSeconds?: number
    },
    dialTest: { completed: boolean, completedAt?: string },
    feedback: { completed: boolean, completedAt?: string }
  }
}
```

### Dial Test Data
```typescript
{
  dataPoints: Array<{
    timestamp: number,        // Video timestamp in seconds
    button: "positive" | "negative" | null,  // Button pressed (for buttons variant)
    intensity: number         // -100 to 100 (negative = losing me, positive = into it)
  }>,
  lastUpdated: string,       // ISO timestamp
  variant: "buttons" | "slider"  // Which variant was used
}
```

### Feedback Data
```typescript
{
  easeOfUse: string,              // "Very easy" to "Very difficult"
  attentionDifficulty: string,    // "Not at all" to "A lot"
  expressiveness: string,         // "Yes, definitely" to "Not at all"
  improvements: string,           // Open text response
  repeatIntent: string,           // "Yes", "Maybe", or "No"
  gender: string,
  primaryShopper: string,
  amazonFrequency: string,
  streamingFrequency: string,
  savedAt: string                 // ISO timestamp
}
```

## Accessing Data

### From Browser Console

After completing a survey, the console will display:
```
Session ID: <uuid>
Variant: buttons | slider
To retrieve this session's data, use: getSessionData("<uuid>")
To retrieve all sessions, use: getAllSessions()
```

You can then use these functions directly in the console:

```javascript
// Import the API utilities
import { getSessionData, getAllSessions } from './utils/api';

// Get a specific session
const session = await getSessionData("session-uuid-here");
console.log(session);

// Get all sessions
const allSessions = await getAllSessions();
console.log(allSessions);
```

### API Endpoints

#### Get Single Session
```
GET /make-server-640b0dec/session/:sessionId
```

Response:
```json
{
  "success": true,
  "session": { /* session metadata */ },
  "dialData": {
    "tutorial": { /* tutorial dial data */ },
    "actual": { /* main video dial data */ }
  },
  "feedback": { /* feedback responses */ }
}
```

#### Get All Sessions
```
GET /make-server-640b0dec/sessions/all
```

Response:
```json
{
  "success": true,
  "count": 42,
  "sessions": [
    {
      "session": { /* session metadata */ },
      "dialData": { /* dial data */ },
      "feedback": { /* feedback */ }
    },
    // ... more sessions
  ]
}
```

## Data Analysis Tips

### Comparing Variants

To analyze A/B test results:

1. **Filter by variant:**
   ```javascript
   const allSessions = await getAllSessions();
   const buttonsSessions = allSessions.sessions.filter(s => s.session.variant === 'buttons');
   const sliderSessions = allSessions.sessions.filter(s => s.session.variant === 'slider');
   ```

2. **Compare completion rates:**
   ```javascript
   const calculateCompletionRate = (sessions) => {
     const total = sessions.length;
     const completed = sessions.filter(s => 
       s.session.pages.feedback?.completed
     ).length;
     return (completed / total) * 100;
   };
   ```

3. **Compare ease of use ratings:**
   ```javascript
   const easeOfUseScores = {
     "Very easy": 5,
     "Somewhat easy": 4,
     "Neither easy nor difficult": 3,
     "Somewhat difficult": 2,
     "Very difficult": 1
   };
   
   const avgEaseOfUse = sessions.reduce((sum, s) => 
     sum + easeOfUseScores[s.feedback?.easeOfUse || "Neither easy nor difficult"], 0
   ) / sessions.length;
   ```

### Device Analysis

Analyze performance by device type:

```javascript
const allSessions = await getAllSessions();
const mobileUsers = allSessions.sessions.filter(s => 
  s.session.deviceInfo?.deviceType === 'mobile'
);
const desktopUsers = allSessions.sessions.filter(s => 
  s.session.deviceInfo?.deviceType === 'desktop'
);
```

### Temporal Analysis

Plot emotion curves over time:

```javascript
const session = await getSessionData("session-uuid");
const emotionData = session.dialData.actual.dataPoints;

// Plot timestamp vs intensity
const chartData = emotionData.map(point => ({
  time: point.timestamp,
  emotion: point.intensity
}));
```

## Exporting Data

To export all sessions as JSON:

```javascript
const allSessions = await getAllSessions();
const dataStr = JSON.stringify(allSessions, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = `nelsurveys-data-${new Date().toISOString()}.json`;
link.click();
```

## Data Retention

Data is stored in Supabase's key-value store with the following keys:
- `session:{sessionId}` - Session metadata
- `dialdata:{sessionId}:tutorial` - Tutorial dial test data
- `dialdata:{sessionId}:actual` - Main video dial test data
- `feedback:{sessionId}` - Feedback responses

## Privacy & Security

- All data is stored server-side in Supabase
- No personally identifiable information (PII) is collected
- Device information is collected for analysis purposes only
- All API calls require authentication via the Supabase anon key
