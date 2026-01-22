package com.kiemnv.MindGardAPI.config;

import com.kiemnv.MindGardAPI.entity.Role;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig {
    private PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                var roles = new HashSet<String>();
                roles.add(Role.ADMIN.name());
                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .email("nkiem347@gmail.com")
                        .roles(Set.of(Role.ADMIN))
                        .build();
                User user1 = User.builder()
                        .username("user")
                        .password(passwordEncoder.encode("user"))
                        .email("nkiem348@gmail.com")
                        .roles(Set.of(Role.USER))
                        .build();
                userRepository.save(user);
                userRepository.save(user1);
                log.warn("admin user has bean create with default password: admin, please change it");
            }
        };
    }

}

