package com.financas.app.controller;

import com.financas.app.domain.Account;
import com.financas.app.domain.User;
import com.financas.app.repository.AccountRepository;
import com.financas.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Account>> listAccounts() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(accountRepository.findByUserIdAndIsActiveTrue(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        User user = userRepository.findAll().stream().findFirst().orElseGet(() ->
                userRepository.save(User.builder().name("Usuário").email("user@financas.app").build()));
        account.setUser(user);
        if (account.getCurrentBalance() == null) {
            account.setCurrentBalance(account.getInitialBalance() != null ? account.getInitialBalance() : java.math.BigDecimal.ZERO);
        }
        return ResponseEntity.ok(accountRepository.save(account));
    }
}

