package com.financas.app.controller;

import com.financas.app.domain.Transaction;
import com.financas.app.domain.User;
import com.financas.app.dto.request.TransactionCreateRequest;
import com.financas.app.repository.TransactionRepository;
import com.financas.app.repository.UserRepository;
import com.financas.app.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Transaction>> listTransactions() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(transactionRepository.findByUserIdOrderByDateDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<List<Transaction>> createTransaction(@RequestBody TransactionCreateRequest req) {
        return ResponseEntity.ok(transactionService.createTransaction(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id) {
        transactionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

