import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Session } from "@/hooks/useSessions";
import {
  Search as SearchIcon,
  Clock,
  Calendar,
  BookOpen,
  X,
  ExternalLink,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchProps {
  sessions: Session[];
}

export default function Search({ sessions }: SearchProps) {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allSubjects = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.subject))).sort(),
    [sessions]
  );

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return sessions
      .filter((s) => {
        const matchesQuery =
          !q ||
          s.subject.toLowerCase().includes(q) ||
          s.goalTopic.toLowerCase().includes(q) ||
          s.remarks.toLowerCase().includes(q) ||
          (s.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          s.date.includes(q);
        const matchesSubject =
          subjectFilter === "all" || s.subject === subjectFilter;
        const matchesDifficulty =
          difficultyFilter === "all" || s.difficulty === difficultyFilter;
        return matchesQuery && matchesSubject && matchesDifficulty;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, query, subjectFilter, difficultyFilter]);

  const totalHours = results.reduce((sum, s) => sum + s.hours, 0);
  const hasFilters =
    query || subjectFilter !== "all" || difficultyFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setSubjectFilter("all");
    setDifficultyFilter("all");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Search bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Search Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              placeholder="Search by subject, topic, notes, tags, or date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {allSubjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Any Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Difficulty</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {hasFilters && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{results.length}</span>{" "}
              result{results.length !== 1 ? "s" : ""}
              {results.length > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-primary">
                    {totalHours.toFixed(1)}h
                  </span>{" "}
                  total
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No sessions logged yet</p>
          <p className="text-sm mt-1">Log your first session to start searching</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <SearchIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No sessions match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {results.map((session, i) => {
              const isExpanded = expandedId === session.id;
              return (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: Math.min(i * 0.025, 0.25) }}
                >
                  <Card
                    className={`cursor-pointer transition-colors hover:border-primary/40 ${isExpanded ? "border-primary/40" : ""}`}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : session.id)
                    }
                  >
                    <CardContent className="pt-4 pb-3">
                      {/* Main row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default" className="shrink-0">
                              {session.subject}
                            </Badge>
                            {session.difficulty && (
                              <Badge
                                variant="outline"
                                className={`text-xs shrink-0 ${getDifficultyColor(session.difficulty)}`}
                              >
                                {session.difficulty}
                              </Badge>
                            )}
                            {(session.tags ?? []).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs shrink-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="font-medium text-sm leading-tight">
                            {session.goalTopic}
                          </p>
                          {!isExpanded && session.remarks && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {session.remarks}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-xl font-bold text-primary">
                            {session.hours.toFixed(1)}h
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.date)}
                          </div>
                          {session.timeStart !== "00:00" && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                              <Clock className="h-3 w-3" />
                              {session.timeStart}–{session.timeEnd}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                              {session.remarks && (
                                <p className="text-sm text-muted-foreground">
                                  {session.remarks}
                                </p>
                              )}
                              {session.mood && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <span>Mood:</span>
                                  <span className="text-yellow-400">
                                    {"★".repeat(session.mood)}
                                  </span>
                                  <span className="text-muted-foreground/40">
                                    {"★".repeat(5 - session.mood)}
                                  </span>
                                </div>
                              )}
                              {(session.attachments ?? []).length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Attachments
                                  </p>
                                  {session.attachments!.map((att) => (
                                    <div
                                      key={att.id}
                                      className="flex items-center gap-2 text-xs"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {att.type === "link" ? (
                                        <>
                                          <ExternalLink className="h-3 w-3 text-primary" />
                                          <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline truncate"
                                          >
                                            {att.name}
                                          </a>
                                        </>
                                      ) : (
                                        <>
                                          <FileText className="h-3 w-3 text-muted-foreground" />
                                          {att.data ? (
                                            <a
                                              href={att.data}
                                              download={att.name}
                                              className="text-primary hover:underline"
                                            >
                                              {att.name}
                                            </a>
                                          ) : (
                                            <span className="text-muted-foreground">
                                              {att.name}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function getDifficultyColor(d: string): string {
  switch (d) {
    case "Easy":   return "text-green-500 border-green-500/30";
    case "Medium": return "text-yellow-500 border-yellow-500/30";
    case "Hard":   return "text-orange-500 border-orange-500/30";
    case "Expert": return "text-red-500 border-red-500/30";
    default:       return "";
  }
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
