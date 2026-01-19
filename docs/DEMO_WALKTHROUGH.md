# GrantSync Demo Walkthrough

A step-by-step guide to demonstrate the GrantSync platform capabilities.

---

## Demo Flow

### 1. Sign In

1. Navigate to the sign-up page
2. Enter account credentials
3. Click "Sign Up"

---

### 2. Dashboard Overview

1. You will see the grant feed page
2. Browse available grants from OurSG Portal
3. Notice the **deadline urgency colors**:
   - 🔴 Red = ≤7 days (urgent)
   - 🟠 Orange = 8-14 days (approaching)
   - 🟢 Teal = >14 days (plenty of time)
4. Click **"Track this Grant"** to add to your Kanban board

---

### 3. Update Profile

1. Click **"Profile"** in the sidebar
2. Update:
   - **Organization Description** — Helps AI provide better recommendations
   - **Interest Areas** — Multi-select focus areas
   - **Minimum Funding** — Filter preference
3. Click **"Save Profile"**

### 4. Create/View a Project

1. Click **"Projects"** in the sidebar
2. View existing project: **"Senior Community Wellness Program"**
3. Or create a new project with:
   - Name, description, target population
   - Focus areas (multi-select)
   - Expected deliverables
   - Funding range (treated as "up to" max amount)

---

### 5. Get AI Recommendations

1. Open a project (e.g., "Senior Community Wellness Program")
2. Click **"View Recommendations"**
3. The system generates recommendations using the 2-stage AI pipeline:
   - **Stage 1:** Embedding pre-filter (semantic similarity)
   - **Stage 2:** LLM analysis (purpose, eligibility, impact)
4. View the **Match Score Breakdown**:
   - 🎯 Purpose Alignment
   - ✅ Eligibility Fit
   - 📈 Impact Relevance

---

### 6. Generate Gap Report

1. On a recommendation card, click **"Generate Gap Report"**
2. AI analyzes the project-grant fit and provides:
   - **Match Assessment** — Overall fit summary
   - **Strengths** — What aligns well
   - **Gaps Identified** — What's missing
   - **Recommendations** — Actionable improvements
   - **Application Tips** — Key points to emphasize

---

### 7. Track Applications (Kanban)

1. Click **"Tracked Grants"** in the sidebar
2. View the Kanban board with columns:
   - **New** → **Reviewing** → **Applied** → **Rejected**
3. Use arrows to move grants between stages
4. Delete tracked grants with the trash icon

---
