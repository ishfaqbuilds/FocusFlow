import type { Session, Goal } from "@/hooks/useSessions";

export function exportToJSON(sessions: Session[], goals: Goal[]): void {
  const data = { sessions, goals };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focusflow-data-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(sessions: Session[]): void {
  const headers = [
    "ID",
    "Subject",
    "Date",
    "Time Start",
    "Time End",
    "Hours",
    "Goal/Topic",
    "Remarks",
    "Mood",
  ];
  const rows = sessions.map((s) => [
    s.id,
    s.subject,
    s.date,
    s.timeStart,
    s.timeEnd,
    s.hours.toString(),
    s.goalTopic || "",
    s.remarks || "",
    s.mood?.toString() || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focusflow-sessions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(
  file: File,
  onSuccess: (sessions: Session[], goals: Goal[]) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (data.sessions && Array.isArray(data.sessions)) {
        onSuccess(data.sessions, data.goals || []);
      } else {
        onError("Invalid JSON format");
      }
    } catch (err) {
      onError("Failed to parse JSON file");
    }
  };
  reader.readAsText(file);
}

export function triggerConfetti(): void {
  const colors = [
    "hsl(142, 76%, 50%)",
    "hsl(142, 76%, 60%)",
    "hsl(142, 76%, 70%)",
    "hsl(200, 76%, 60%)",
    "hsl(45, 76%, 60%)",
  ];

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div");
    particle.className = "confetti-particle";
    particle.style.left = Math.random() * 100 + "vw";
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.animationDelay = Math.random() * 0.3 + "s";
    particle.style.animationDuration = 2 + Math.random() * 1 + "s";
    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 4000);
  }
}
