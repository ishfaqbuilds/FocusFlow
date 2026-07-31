import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountingNumber } from "@/components/CountingNumber";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { useStats, getLocalDateStr } from "@/hooks/useSessions";
import type { Session, Settings } from "@/hooks/useSessions";
import { formatTime as formatTimeUtil } from "@/lib/utils";
import {
  Clock,
  Flame,
  Target,
  Calendar,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardProps {
  sessions: Session[];
  weeklyGoalHours: number;
  settings: Settings;
}

export default function Dashboard({
  sessions,
  weeklyGoalHours,
  settings,
}: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const stats = useStats(sessions);
  const quote = getQuoteOfTheDay();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const recentSessions = sessions
    .filter((session) => session.date === getLocalDateStr())
    .slice()
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.timeStart.localeCompare(a.timeStart);
    })
    .slice(0, 5);

  const formatTimeDisplay = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    
    if (settings.timeFormat === "24h") {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    
    // 12h format
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`;
  };

  const formatDate = (time: Date) => {
    return time.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const statCards = [
    {
      title: "Today's Study Hours",
      value: stats.todayHours,
      decimals: 1,
      icon: Clock,
      color: "text-primary",
    },
    {
      title: "Current Streak",
      value: stats.streak,
      decimals: 0,
      suffix: stats.streak === 1 ? " day" : " days",
      icon: Flame,
      color: "text-orange-500",
    },
    {
      title: "Weekly Progress",
      value: stats.weekHours,
      decimals: 1,
      suffix: ` / ${weeklyGoalHours} hrs`,
      icon: Target,
      color: "text-blue-500",
    },
    {
      title: "Month Completion",
      value: stats.monthCompletionRate,
      decimals: 0,
      suffix: "%",
      icon: Calendar,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">
          {formatTimeDisplay(currentTime)}
        </h1>
        <p className="text-muted-foreground text-lg">{formatDate(currentTime)}</p>
      </motion.div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <p className="text-center text-lg italic text-muted-foreground">
              "{quote}"
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <CountingNumber value={stat.value} decimals={stat.decimals} />
                  {stat.suffix && (
                    <span className="text-lg text-muted-foreground ml-1">
                      {stat.suffix}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No sessions logged today. Start your first session!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{session.subject}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {session.date}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{session.goalTopic}</p>
                      {session.remarks && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {session.remarks}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary">
                        {session.hours}h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeUtil(session.timeStart, settings.timeFormat)} - {formatTimeUtil(session.timeEnd, settings.timeFormat)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
