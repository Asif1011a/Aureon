/**
 * Aureon AI Matching Engine
 * ──────────────────────────────────────────────────────────────────────────
 * Scores volunteers against service requests using a weighted multi-factor
 * algorithm. Designed to be the core "brain" of the Aureon platform.
 *
 * Scoring factors (total = 100 points):
 *   1. Skill match         — 40 pts  (most important)
 *   2. Availability        — 20 pts
 *   3. Experience & rating — 25 pts  (tasks completed + star rating)
 *   4. Location proximity  — 15 pts  (area string match as a proxy)
 */

// ──────────────────────────────────────────────────────────────────────────
// 1. Skill Match  (0–40 pts)
// ──────────────────────────────────────────────────────────────────────────
function skillScore(volunteer, request) {
  const required = request.requiredSkills ?? [];
  const volSkills = volunteer.skills ?? [];

  if (required.length === 0) return 30; // no specific skills required → partial credit

  const matched = required.filter(s =>
    volSkills.some(vs => vs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(vs.toLowerCase()))
  );

  const ratio = matched.length / required.length;
  return Math.round(ratio * 40);
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Availability  (0–20 pts)
// ──────────────────────────────────────────────────────────────────────────
function availabilityScore(volunteer) {
  if (!volunteer.isAvailable) return 0;

  const avail = (volunteer.availability ?? "").toLowerCase();
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay(); // 0=Sun … 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isEvening = hour >= 17;
  const isWeekday = !isWeekend;

  if (avail === "always") return 20;
  if (avail === "weekends" && isWeekend) return 20;
  if (avail === "weekdays" && isWeekday) return 20;
  if (avail === "evenings" && isEvening) return 20;

  // Available but timing sub-optimal → partial credit
  return 10;
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Experience & Rating  (0–25 pts)
// ──────────────────────────────────────────────────────────────────────────
function experienceScore(volunteer) {
  const tasks = volunteer.tasksCompleted ?? 0;
  const rating = volunteer.rating ?? 5.0;

  // Tasks: 0 = 0 pts, 5+ = 15 pts (max)
  const taskPts = Math.min(tasks, 20) * (15 / 20);

  // Rating: 1–5 scale mapped to 0–10 pts
  const ratingPts = ((rating - 1) / 4) * 10;

  return Math.round(taskPts + ratingPts);
}

// ──────────────────────────────────────────────────────────────────────────
// 4. Location Proximity  (0–15 pts)
// ──────────────────────────────────────────────────────────────────────────
function locationScore(volunteer, request) {
  const volArea = (volunteer.address ?? "").toLowerCase();
  const reqArea = (request.area ?? "").toLowerCase();

  if (!volArea || !reqArea) return 7; // unknown → midpoint

  // Exact match
  if (volArea.includes(reqArea) || reqArea.includes(volArea)) return 15;

  // Both in Coimbatore → partial credit
  const cbeKeywords = ["coimbatore", "cbe", "kovai"];
  const bothCbe = cbeKeywords.some(k => volArea.includes(k)) ||
    cbeKeywords.some(k => reqArea.includes(k));
  if (bothCbe) return 8;

  return 4;
}

// ──────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────

/**
 * Calculate a composite match score (0–100) for one volunteer vs one request.
 * Returns an object with the total score and the individual component scores.
 */
export function calculateMatchScore(volunteer, request) {
  const skill   = skillScore(volunteer, request);
  const avail   = availabilityScore(volunteer);
  const exp     = experienceScore(volunteer);
  const loc     = locationScore(volunteer, request);
  const total   = skill + avail + exp + loc;

  return {
    total: Math.min(total, 100),
    breakdown: { skill, availability: avail, experience: exp, location: loc },
  };
}

/**
 * Generate a human-readable explanation of why a volunteer was matched.
 */
export function explainMatch(volunteer, request, breakdown) {
  const parts = [];

  const required = request.requiredSkills ?? [];
  const volSkills = volunteer.skills ?? [];
  const matchedSkills = required.filter(s =>
    volSkills.some(vs => vs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(vs.toLowerCase()))
  );

  if (matchedSkills.length > 0) {
    parts.push(`Skill match: ${matchedSkills.join(", ")}`);
  } else if (required.length === 0) {
    parts.push("General responder profile");
  }

  if (breakdown.availability >= 20) parts.push("Currently available");
  else if (breakdown.availability > 0) parts.push("Available with schedule constraints");

  const tasks = volunteer.tasksCompleted ?? 0;
  if (tasks >= 10) parts.push(`${tasks} missions completed`);
  else if (tasks > 0) parts.push(`${tasks} prior missions`);

  if (breakdown.location >= 15) parts.push("Same deployment zone");
  else if (breakdown.location >= 8) parts.push("Local area volunteer");

  return parts.join(" · ") || "Best available responder profile";
}

/**
 * Rank all volunteers against a request and return the top N matches.
 * Each item: { volunteer, score: number, breakdown, reason: string }
 */
export function getTopMatches(volunteers, request, n = 5) {
  const available = volunteers.filter(v => v.isAvailable !== false);
  const all = available.length > 0 ? available : volunteers; // fallback if none available

  const scored = all.map(vol => {
    const { total, breakdown } = calculateMatchScore(vol, request);
    return {
      volunteer: vol,
      volunteerId: vol.id ?? vol.uid,
      matchScore: total,
      breakdown,
      reason: explainMatch(vol, request, breakdown),
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, n);
}
