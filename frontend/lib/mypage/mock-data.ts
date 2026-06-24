import type { PlaySessionItem, UserProfile } from "@/lib/auth/types";

export const mockUserProfile: UserProfile = {
  id: 1,
  auth_provider: "local",
  login_id: "history_explorer",
  name: "김역사",
  email: "explorer@example.com",
  nickname: "탐험가42",
  grade: "student",
  created_at: "2026-03-10T09:12:00+09:00",
  updated_at: "2026-06-20T14:30:00+09:00",
};

export const mockPlaySessions: PlaySessionItem[] = [
  {
    id: "session-001",
    scenario_id: 12,
    ending_id: 3,
    character_name: "윤봉길",
    scenario_title: "상하이, 의거의 밤",
    status: "completed",
    history_score: 86,
    choices_path: ["A", "B", "A", "A"],
    created_at: "2026-06-18T15:20:00+09:00",
    completed_at: "2026-06-18T15:47:00+09:00",
  },
  {
    id: "session-002",
    scenario_id: 8,
    ending_id: 1,
    character_name: "세종대왕",
    scenario_title: "훈민정음, 백성의 글",
    status: "completed",
    history_score: 92,
    choices_path: ["B", "A", "B", "B", "A"],
    created_at: "2026-06-12T11:05:00+09:00",
    completed_at: "2026-06-12T11:38:00+09:00",
  },
];
