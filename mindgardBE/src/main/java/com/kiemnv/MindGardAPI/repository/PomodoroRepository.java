package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.PomodoroSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PomodoroRepository extends JpaRepository<PomodoroSession, Long> {
    Page<PomodoroSession> findByUserId(Long userId, Pageable pageable);
    List<PomodoroSession> findTop1000ByUserIdAndStatusOrderByStartAtDesc(Long userId, PomodoroSession.Status status);
}
