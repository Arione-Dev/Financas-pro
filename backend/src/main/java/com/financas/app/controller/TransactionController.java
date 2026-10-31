package com.financas.app.controller;

import com.financas.app.domain.Invoice;
import com.financas.app.domain.Transaction;
import com.financas.app.domain.User;
import com.financas.app.dto.request.TransactionCreateRequest;
import com.financas.app.repository.AccountRepository;
import com.financas.app.repository.InvoiceRepository;
import com.financas.app.repository.TransactionRepository;
import com.financas.app.repository.UserRepository;
import com.financas.app.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final InvoiceRepository invoiceRepository;
    private final AccountRepository accountRepository;
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

    @PostMapping("/{id}/pay")
    public ResponseEntity<Void> payTransaction(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        try {
            UUID uuid = UUID.fromString(id.trim());
            transactionRepository.findById(uuid).ifPresent(t -> {
                t.setIsPaid(true);
                if (t.getInvoice() != null && t.getAmount() != null) {
                    Invoice inv = t.getInvoice();
                    inv.setTotalAmount(inv.getTotalAmount().subtract(t.getAmount()));
                    if (inv.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
                        inv.setTotalAmount(BigDecimal.ZERO);
                    }
                    invoiceRepository.save(inv);
                }
                if (body != null && body.containsKey("accountId")) {
                    try {
                        UUID accId = UUID.fromString(body.get("accountId").trim());
                        accountRepository.findById(accId).ifPresent(acc -> {
                            BigDecimal newBal = acc.getCurrentBalance().subtract(t.getAmount());
                            acc.setCurrentBalance(newBal.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newBal);
                            accountRepository.save(acc);
                        });
                    } catch (Exception ignored) {}
                }
                transactionRepository.save(t);
            });
        } catch (IllegalArgumentException e) {
            // ID local ou inválido
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable String id) {
        try {
            UUID uuid = UUID.fromString(id.trim());
            transactionRepository.findById(uuid).ifPresent(t -> {
                if (t.getInvoice() != null && t.getAmount() != null) {
                    Invoice inv = t.getInvoice();
                    inv.setTotalAmount(inv.getTotalAmount().subtract(t.getAmount()));
                    if (inv.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
                        inv.setTotalAmount(BigDecimal.ZERO);
                    }
                    invoiceRepository.save(inv);
                }
                transactionRepository.delete(t);
            });
        } catch (IllegalArgumentException e) {
            // ID local ou inválido
        }
        return ResponseEntity.noContent().build();
    }
}
