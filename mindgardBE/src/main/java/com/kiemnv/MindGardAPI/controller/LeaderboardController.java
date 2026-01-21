package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import com.kiemnv.MindGardAPI.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Leaderboard endpoints")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    @Operation(summary = "List leaderboard for period")
    public ResponseEntity<ApiResponse<Page<LeaderboardEntry>>> list(@RequestParam(defaultValue = "weekly") String period, Pageable pageable) {
        Page<LeaderboardEntry> page = leaderboardService.list(period, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Leaderboard retrieved"));
    }

    @GetMapping("/top")
    @Operation(summary = "Top leaderboard entries for period")
    public ResponseEntity<ApiResponse<List<LeaderboardEntry>>> top(@RequestParam(defaultValue = "weekly") String period) {
        List<LeaderboardEntry> list = leaderboardService.top(period);
        return ResponseEntity.ok(ApiResponse.success(list, "Top entries retrieved"));
    }
}
