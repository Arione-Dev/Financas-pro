package com.financas.app.service;

import com.financas.app.domain.Account;
import com.financas.app.domain.User;
import com.financas.app.domain.enums.AccountType;
import com.financas.app.repository.AccountRepository;
import com.financas.app.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserContextService {

    private final HttpServletRequest request;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    public User getCurrentUser() {
        if (request == null) {
            return null;
        }

        // 1. Tenta pelo token JWT no header Authorization
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (!token.isEmpty()) {
                try {
                    Claims claims = Jwts.parser()
                            .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();
                    String subject = claims.getSubject();
                    if (subject != null) {
                        UUID userId = UUID.fromString(subject.trim());
                        Optional<User> byJwtId = userRepository.findById(userId);
                        if (byJwtId.isPresent()) {
                            return byJwtId.get();
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        // 2. Tenta pelo header X-User-Id (UUID válido no banco)
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                UUID userId = UUID.fromString(userIdHeader.trim());
                Optional<User> byId = userRepository.findById(userId);
                if (byId.isPresent()) {
                    return byId.get();
                }
            } catch (IllegalArgumentException ignored) {
            }
        }

        // 3. Tenta pelo header X-User-Email
        String userEmailHeader = request.getHeader("X-User-Email");
        if (userEmailHeader != null && !userEmailHeader.isBlank()) {
            String cleanEmail = userEmailHeader.trim();
            Optional<User> byEmail = userRepository.findByEmail(cleanEmail);
            if (byEmail.isPresent()) {
                return byEmail.get();
            }

            // Se o usuário tiver e-mail válido no header mas ainda não existir no banco, cria isolado
            String userNameHeader = request.getHeader("X-User-Name");
            String nameToUse = (userNameHeader != null && !userNameHeader.isBlank()) ? userNameHeader.trim() : cleanEmail.split("@")[0];
            User newUser = userRepository.save(User.builder()
                    .name(nameToUse)
                    .email(cleanEmail)
                    .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + nameToUse)
                    .build());

            accountRepository.save(Account.builder()
                    .user(newUser)
                    .name("Conta Principal")
                    .type(AccountType.CHECKING)
                    .initialBalance(BigDecimal.ZERO)
                    .currentBalance(BigDecimal.ZERO)
                    .color("#8A05BE")
                    .isActive(true)
                    .build());

            return newUser;
        }

        return null;
    }
}
