package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.UserStats;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.UserStatsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserStatsService {

    private final UserStatsRepository userStatsRepository;

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
}
