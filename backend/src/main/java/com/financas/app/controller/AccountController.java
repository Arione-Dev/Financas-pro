package com.financas.app.controller;

import com.financas.app.domain.Account;
import com.financas.app.domain.User;
import com.financas.app.domain.enums.AccountType;
import com.financas.app.repository.AccountRepository;
import com.financas.app.service.UserContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountRepository accountRepository;
    private final UserContextService userContextService;

    @GetMapping
    public ResponseEntity<List<Account>> listAccounts() {
        User user = userContextService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (accounts.isEmpty()) {
            Account defaultAcc = Account.builder()
                    .user(user)
                    .name("Conta Principal")
                    .type(AccountType.CHECKING)
                    .initialBalance(BigDecimal.ZERO)
                    .currentBalance(BigDecimal.ZERO)
                    .color("#8A05BE")
                    .isActive(true)
                    .build();
            accounts = List.of(accountRepository.save(defaultAcc));
        }
        return ResponseEntity.ok(accounts);
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        User user = userContextService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        account.setUser(user);
        if (account.getCurrentBalance() == null) {
            account.setCurrentBalance(account.getInitialBalance() != null ? account.getInitialBalance() : BigDecimal.ZERO);
        }
        if (account.getIsActive() == null) {
            account.setIsActive(true);
        }
        return ResponseEntity.ok(accountRepository.save(account));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Account> updateAccountBalance(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        User user = userContextService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return accountRepository.findById(id)
                .filter(acc -> acc.getUser() != null && acc.getUser().getId().equals(user.getId()))
                .map(acc -> {
                    if (body.containsKey("currentBalance")) {
                        acc.setCurrentBalance(new BigDecimal(body.get("currentBalance").toString()));
                    }
                    if (body.containsKey("name")) {
                        acc.setName((String) body.get("name"));
                    }
                    return ResponseEntity.ok(accountRepository.save(acc));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID id) {
        User user = userContextService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        accountRepository.findById(id)
                .filter(acc -> acc.getUser() != null && acc.getUser().getId().equals(user.getId()))
                .ifPresent(acc -> {
                    acc.setIsActive(false);
                    accountRepository.save(acc);
                });
        return ResponseEntity.noContent().build();
    }
}
