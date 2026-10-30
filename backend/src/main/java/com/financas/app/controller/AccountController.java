package com.financas.app.controller;

import com.financas.app.domain.Account;
import com.financas.app.domain.User;
import com.financas.app.domain.enums.AccountType;
import com.financas.app.repository.AccountRepository;
import com.financas.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Account>> listAccounts() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (accounts.isEmpty()) {
            Account defaultAcc = Account.builder()
                    .user(user)
                    .name("Conta Principal")
                    .type(AccountType.CHECKING)
                    .initialBalance(new BigDecimal("1000.00"))
                    .currentBalance(new BigDecimal("1000.00"))
                    .color("#8A05BE")
                    .isActive(true)
                    .build();
            accounts = List.of(accountRepository.save(defaultAcc));
        }
        return ResponseEntity.ok(accounts);
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        User user = userRepository.findAll().stream().findFirst().orElseGet(() ->
                userRepository.save(User.builder().name("Usuário").email("user@financas.app").build()));
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
        return accountRepository.findById(id).map(acc -> {
            if (body.containsKey("currentBalance")) {
                acc.setCurrentBalance(new BigDecimal(body.get("currentBalance").toString()));
            }
            if (body.containsKey("name")) {
                acc.setName((String) body.get("name"));
            }
            return ResponseEntity.ok(accountRepository.save(acc));
        }).orElse(ResponseEntity.notFound().build());
    }
}
