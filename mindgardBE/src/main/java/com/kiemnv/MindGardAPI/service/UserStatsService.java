package com.kiemnv.MindGardAPI.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kiemnv.MindGardAPI.entity.PomodoroSession;
import com.kiemnv.MindGardAPI.entity.UserStats;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.PomodoroRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import com.kiemnv.MindGardAPI.repository.UserStatsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserStatsService {

    private final UserStatsRepository userStatsRepository;
    private final PomodoroRepository pomodoroRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public UserStats getForUser(User user) {
        return userStatsRepository.findByUserId(user.getId()).orElseGet(() -> UserStats.builder().user(user).totalFocusSeconds(0L).pomodoroCount(0).dailyStreak(0).byDayJson("{}").updatedAt(LocalDateTime.now()).build());
    }

    @Transactional
    public UserStats updateStats(User user, Long addFocusSeconds, Integer addPomodoros) {
        UserStats s = userStatsRepository.findByUserId(user.getId()).orElseGet(() -> UserStats.builder().user(user).totalFocusSeconds(0L).pomodoroCount(0).dailyStreak(0).byDayJson("{}").updatedAt(LocalDateTime.now()).build());
        if (addFocusSeconds != null) s.setTotalFocusSeconds(s.getTotalFocusSeconds() + addFocusSeconds);
        if (addPomodoros != null) s.setPomodoroCount(s.getPomodoroCount() + addPomodoros);
        s.setUpdatedAt(LocalDateTime.now());
        return userStatsRepository.save(s);
    }

    /**
     * Called whenever a FINISHED focus session is recorded.
     * Updates:
     * - totalFocusSeconds
     * - pomodoroCount
     * - byDayJson (YYYY-MM-DD -> minutes)
     * - dailyStreak (consecutive days ending today)
     * - user XP/level
     */
    @Transactional
    public void applyCompletedSession(User user, LocalDateTime endAtUtc, long durationSeconds) {
        if (user == null || user.getId() == null) return;
        if (endAtUtc == null || durationSeconds <= 0) return;

        UserStats s = userStatsRepository.findByUserId(user.getId())
                .orElseGet(() -> UserStats.builder()
                        .user(user)
                        .totalFocusSeconds(0L)
                        .pomodoroCount(0)
                        .dailyStreak(0)
                        .byDayJson("{}")
                        .updatedAt(LocalDateTime.now())
                        .build());

        // totals
        s.setTotalFocusSeconds((s.getTotalFocusSeconds() != null ? s.getTotalFocusSeconds() : 0L) + durationSeconds);
        s.setPomodoroCount((s.getPomodoroCount() != null ? s.getPomodoroCount() : 0) + 1);

        // by-day aggregation (minutes)
        String dayKey = endAtUtc.toLocalDate().toString();
        Map<String, Integer> byDay = safeParseByDay(s.getByDayJson());
        int addMin = (int) Math.max(0, durationSeconds / 60);
        byDay.merge(dayKey, addMin, Integer::sum);
        s.setByDayJson(safeWriteByDay(byDay));

        // streak: compute based on finished sessions (authoritative)
        int streak = computeCurrentStreakDays(user.getId());
        s.setDailyStreak(streak);
        s.setUpdatedAt(LocalDateTime.now());
        userStatsRepository.save(s);

        // XP/level
        applyXpAndLevel(user.getId(), addMin);
    }

    private Map<String, Integer> safeParseByDay(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            Map<String, Integer> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
            return parsed != null ? parsed : new HashMap<>();
        } catch (Exception ignored) {
            return new HashMap<>();
        }
    }

    private String safeWriteByDay(Map<String, Integer> map) {
        try {
            return objectMapper.writeValueAsString(map != null ? map : Map.of());
        } catch (Exception ignored) {
            return "{}";
        }
    }

    private int computeCurrentStreakDays(Long userId) {
        // Use last 1000 finished sessions, derive unique date set
        List<PomodoroSession> list = pomodoroRepository.findTop1000ByUserIdAndStatusOrderByStartAtDesc(userId, PomodoroSession.Status.FINISHED);
        Set<String> days = list.stream()
                .map(p -> {
                    try {
                        if (p.getEndAt() != null) return p.getEndAt().toLocalDate().toString();
                        if (p.getStartAt() != null && p.getDurationSeconds() != null) {
                            return p.getStartAt().plusSeconds(p.getDurationSeconds()).toLocalDate().toString();
                        }
                        return null;
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(x -> x != null)
                .collect(Collectors.toSet());

        int streak = 0;
        for (int i = 0; ; i++) {
            String key = LocalDate.now(ZoneOffset.UTC).minusDays(i).toString();
            if (days.contains(key)) streak++;
            else break;
        }
        return streak;
    }

    private void applyXpAndLevel(Long userId, int durationMinutes) {
        if (durationMinutes <= 0) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        long earnedXp = durationMinutes * 10L; // 10 XP / minute focus

        int level = user.getLevel() != null ? user.getLevel() : 1;
        long currentXp = user.getCurrentXP() != null ? user.getCurrentXP() : 0L;
        long xpToNext = user.getXpToNextLevel() != null ? user.getXpToNextLevel() : 100L;

        currentXp += earnedXp;
        while (currentXp >= xpToNext) {
            currentXp -= xpToNext;
            level += 1;
            // progressive curve: +20% and +50 base
            xpToNext = Math.round(xpToNext * 1.2 + 50);
        }

        user.setLevel(level);
        user.setCurrentXP(currentXp);
        user.setXpToNextLevel(xpToNext);
        userRepository.save(user);
    }
}
