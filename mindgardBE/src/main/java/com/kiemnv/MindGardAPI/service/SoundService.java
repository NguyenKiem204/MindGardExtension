package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.Sound;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.SoundRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SoundService {

    private final SoundRepository soundRepository;

    public Page<Sound> list(User user, Pageable pageable) {
        return soundRepository.findByUserId(user.getId(), pageable);
    }

    public List<Sound> listAll(User user) {
        return soundRepository.findByUserIdOrUserIsNull(user.getId());
    }

    @Transactional
    public Sound create(User user, Sound s) {
        s.setUser(user);
        s.setCreatedAt(LocalDateTime.now());
        return soundRepository.save(s);
    }

    @Transactional
    public Sound update(Long id, User user, Sound update) {
        Sound s = soundRepository.findById(id)
                .filter(x -> x.getUser() == null || x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Sound not found or not allowed"));
        if (update.getName() != null) s.setName(update.getName());
        if (update.getSrcUrl() != null) s.setSrcUrl(update.getSrcUrl());
        if (update.getVolumeDefault() != null) s.setVolumeDefault(update.getVolumeDefault());
        return soundRepository.save(s);
    }

    @Transactional
    public void delete(Long id, User user) {
        Sound s = soundRepository.findById(id)
                .filter(x -> x.getUser() == null || x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Sound not found or not allowed"));
        soundRepository.delete(s);
    }
}
