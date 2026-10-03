# ASTRAL — Astronaut Health Monitoring Dashboard

> **Mission Control for Astronaut Health**

ASTRAL is a mission-control inspired astronaut health monitoring dashboard designed to visualize simulated crew health data, detect abnormal conditions, calculate an overall mission health score, and provide real-time alerts.

The project focuses on turning raw health telemetry into a clear, actionable interface for monitoring astronaut well-being during a simulated space mission.

> **Note:** The telemetry and mission context used in this project are simulated for demonstration purposes and do not represent real astronaut or spacecraft data.

---

## Overview

In a space mission, crew health parameters need to be continuously monitored so that abnormal conditions can be identified quickly.

ASTRAL provides a centralized interface for monitoring:

* Heart Rate
* Oxygen Saturation (SpO₂)
* Temperature
* Sleep
* Exercise

The dashboard continuously updates simulated telemetry and evaluates each parameter against predefined thresholds.

When an abnormal condition occurs, ASTRAL automatically updates the health status, mission score, graph, timeline, and alert system.

---

## Features

### 🧑‍🚀 Crew Profile

Displays the monitored crew member's:

* Astronaut profile
* Role
* Mission
* Mission day
* Crew status

A dedicated astronaut visualization acts as the central health-monitoring element.

### ❤️ Live Health Monitoring

Simulated health telemetry updates continuously to provide a live monitoring experience.

Monitored parameters include:

| Parameter         |        Example |
| ----------------- | -------------: |
| Heart Rate        |         72 BPM |
| Oxygen Saturation |            97% |
| Temperature       |         36.7°C |
| Sleep             |        7.2 hrs |
| Exercise          | Activity level |

---

### 🚨 Intelligent Health Alerts

Every health parameter is evaluated against predefined thresholds.

The system identifies three states:

**NORMAL → WARNING → CRITICAL**

Critical conditions trigger a detailed alert containing:

* Affected parameter
* Current value
* Threshold
* Severity
* Trend
* Explanation
* Timestamp
* Acknowledge action

Critical alerts also activate a persistent alarm until the alert is acknowledged.

---

### 📊 Mission Health Score

ASTRAL calculates an overall health score from **0–100** using the monitored parameters.

The score is derived from weighted parameter health:

* SpO₂ — 30%
* Heart Rate — 25%
* Temperature — 20%
* Sleep — 12.5%
* Exercise — 12.5%

The resulting score is converted into an overall mission health state:

* **NOMINAL**
* **WARNING**
* **CRITICAL**

A critical parameter can also force the overall mission status to critical regardless of the numerical score.

---

### 📈 Live Health Graph

The dashboard provides historical visualization of the simulated telemetry.

Users can switch between:

* Heart Rate
* SpO₂
* Temperature
* Sleep
* Exercise

The graph includes threshold information and highlights health-status transitions.

---

### 🕒 Mission Health Timeline

Meaningful health events are recorded in chronological order.

Examples include:

* Health status changes
* Exercise milestones
* Routine health checks
* Critical alerts
* Recovery events

The timeline avoids logging every simulation tick and instead focuses on events meaningful to the crew's health.

---

### 🌍 Simulated Mission Context

ASTRAL includes a compact orbital context visualization showing simulated mission information such as:

* Altitude
* Velocity
* Orbit duration
* Next ground contact

This section is explicitly marked as **SIMULATED MISSION CONTEXT** and is not connected to real spacecraft telemetry.

---

### 🎛️ Mission Simulation Controls

The dashboard includes controls for demonstrating different health conditions.

For example:

```text
SIMULATE EMERGENCY
        ↓
SpO₂ decreases
        ↓
WARNING
        ↓
CRITICAL
        ↓
Alert activates
        ↓
Mission score changes
        ↓
Graph + timeline update
        ↓
Persistent alarm
```

The simulation can then be returned to a nominal state.

---

## Alert System

The alert system follows a simple threshold-based monitoring pipeline:

```text
Simulated Telemetry
        │
        ▼
Threshold Evaluation
        │
        ▼
Parameter Status
 NORMAL / WARNING / CRITICAL
        │
        ▼
Alert Generation
        │
        ├──► Mission Health Score
        ├──► Health Graph
        ├──► Mission Timeline
        └──► Critical Alarm
```

### Example

If oxygen saturation falls below the critical threshold:

```text
SpO₂: 87%
Threshold: 90%

        ↓

CRITICAL HEALTH EVENT

        ↓

Mission status → CRITICAL
Mission score → recalculated
Graph → critical region highlighted
Timeline → event recorded
Alarm → activated
```

The alarm continues until the user acknowledges the alert.

When the parameter returns to a safe range, the alert is cleared.

---

## Architecture

ASTRAL uses a single simulation pipeline so that all parts of the dashboard remain synchronized.

```text
useSimulation()
      │
      ▼
stepSimulation()
      │
      ├── Current Reading
      ├── Historical Data
      ├── Parameter Status
      ├── Overall Status
      ├── Mission Health Score
      ├── Timeline Events
      └── Active Alerts
              │
              ▼
         Dashboard UI
```

The project intentionally avoids separate simulation systems for individual components.

This ensures that the:

**Vitals → Score → Graph → Timeline → Alerts**

all represent the same underlying state.

---

## Tech Stack

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **SVG**
* **Web Audio API**

The project uses browser-native functionality for the alert alarm and does not require an additional audio library.

---

## Design System

ASTRAL follows a mission-control visual language:

* Near-black / navy background
* Dark mission panels
* Cyan telemetry accents
* Amber warning states
* Red critical states
* Monospace telemetry
* Clean sans-serif interface text
* Thin borders
* Restrained animations

The goal is to make the interface feel like a focused mission-control console rather than a conventional analytics dashboard.

---

## Project Structure

```text
astro-health-tracker/
├── app/
│   ├── globals.css
│   └── ...
│
├── components/
│   ├── Dashboard.tsx
│   ├── CrewProfile.tsx
│   ├── AstronautSilhouette.tsx
│   ├── VitalsGrid.tsx
│   ├── HealthGraph.tsx
│   ├── Timeline.tsx
│   ├── AlertsPanel.tsx
│   └── OrbitalContext.tsx
│
├── lib/
│   ├── simulation.ts
│   ├── telemetry.ts
│   ├── healthScore.ts
│   └── events.ts
│
└── public/
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd astro-health-tracker
```

### 2. Install dependencies

```bash
bun install
```

### 3. Start the development server

```bash
bun dev
```

Open the local development URL shown in the terminal.

---

## Validation

The project can be checked with:

```bash
bunx tsc --noEmit
bun run lint
bun run build
```

---

## Simulation Disclaimer

ASTRAL is a **demonstration and visualization project**.

The health readings, astronaut information, mission data, orbital values, and emergency scenarios are simulated.

They should not be interpreted as:

* Real astronaut telemetry
* Medical advice
* Real spacecraft telemetry
* NASA or other space-agency data
* Production medical monitoring software

---

## Future Improvements

Potential future improvements include:

* Interactive astronaut body-region health selection
* Mission-mode simulation such as Cruise, Exercise, Sleep, EVA, and Emergency
* More advanced health trend analysis
* Historical mission reports
* Configurable health thresholds
* Multi-crew monitoring
* Real telemetry ingestion from an external data pipeline

---

## Why ASTRAL?

ASTRAL explores how complex astronaut health telemetry can be transformed into a simple visual monitoring system.

Instead of overwhelming the operator with dozens of telemetry values, the dashboard focuses on:

**Observe → Detect → Understand → Respond**

The goal is to make an abnormal health condition immediately understandable while keeping the normal mission state calm and information-dense.

---

## License

This project is intended for educational, experimental, and demonstration purposes.

