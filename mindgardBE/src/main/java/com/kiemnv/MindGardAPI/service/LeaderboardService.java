package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.LeaderboardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;

    public Page<LeaderboardEntry> list(String period, Pageable pageable) {
        return leaderboardRepository.findByPeriod(period, pageable);
    }

    public List<LeaderboardEntry> top(String period) {
        return leaderboardRepository.findByPeriodOrderByScoreDesc(period);
    }

    @Transactional
    public LeaderboardEntry upsert(User user, String period, Long score) {
        LeaderboardEntry e = LeaderboardEntry.builder().user(user).period(period).score(score).rank(null).createdAt(LocalDateTime.now()).build();
        return leaderboardRepository.save(e);
    }
}
