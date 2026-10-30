package com.financas.app.service;

import com.financas.app.domain.Account;
import com.financas.app.domain.Category;
import com.financas.app.domain.CreditCard;
import com.financas.app.domain.User;
import com.financas.app.domain.enums.AccountType;
import com.financas.app.domain.enums.TransactionType;
import com.financas.app.dto.request.LoginRequest;
import com.financas.app.dto.request.RegisterRequest;
import com.financas.app.dto.response.AuthResponse;
import com.financas.app.repository.AccountRepository;
import com.financas.app.repository.CategoryRepository;
import com.financas.app.repository.CreditCardRepository;
import com.financas.app.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CreditCardRepository creditCardRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        User user = User.builder()
                .name(req.name())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + req.name())
                .build();

        user = userRepository.save(user);

        // Cria contas e categorias padrão para o novo usuário
        seedUserDefaults(user);

        String token = generateToken(user);
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), token);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha inválidos."));

        if (user.getPasswordHash() != null && !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }

        String token = generateToken(user);
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), token);
    }

    @Transactional
    public AuthResponse loginWithGoogle(String email, String name, String googleId, String avatarUrl) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .name(name != null ? name : "Usuário Google")
                    .googleId(googleId)
                    .avatarUrl(avatarUrl != null ? avatarUrl : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + email)
                    .build();
            User saved = userRepository.save(newUser);
            seedUserDefaults(saved);
            return saved;
        });

        String token = generateToken(user);
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getAvatarUrl(), token);
    }

    public List<User> listAllUsers() {
        return userRepository.findAll();
    }

    private void seedUserDefaults(User user) {
        // Conta Principal
        accountRepository.save(Account.builder()
                .user(user)
                .name("Conta Principal")
                .type(AccountType.CHECKING)
                .initialBalance(new BigDecimal("1000.00"))
                .currentBalance(new BigDecimal("1000.00"))
                .color("#8A05BE")
                .build());

        // Cartão de Crédito Padrão
        creditCardRepository.save(CreditCard.builder()
                .user(user)
                .name("Cartão Principal")
                .limitTotal(new BigDecimal("5000.00"))
                .closingDay(25)
                .dueDay(5)
                .color("#4F46E5")
                .build());

        // Categorias padrão
        categoryRepository.saveAll(List.of(
                Category.builder().user(user).name("Alimentação").icon("utensils").color("#F59E0B").type(TransactionType.EXPENSE).build(),
                Category.builder().user(user).name("Supermercado").icon("shopping-cart").color("#10B981").type(TransactionType.EXPENSE).build(),
                Category.builder().user(user).name("Transporte").icon("car").color("#3B82F6").type(TransactionType.EXPENSE).build(),
                Category.builder().user(user).name("Moradia").icon("home").color("#8B5CF6").type(TransactionType.EXPENSE).build(),
                Category.builder().user(user).name("Lazer").icon("gamepad-2").color("#06B6D4").type(TransactionType.EXPENSE).build(),
                Category.builder().user(user).name("Salário").icon("wallet").color("#10B981").type(TransactionType.INCOME).build()
        ));
    }

    private String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }
}
