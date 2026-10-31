package com.financas.app.controller;

import com.financas.app.domain.Account;
import com.financas.app.domain.CreditCard;
import com.financas.app.domain.Invoice;
import com.financas.app.domain.Transaction;
import com.financas.app.domain.User;
import com.financas.app.domain.enums.InvoiceStatus;
import com.financas.app.domain.enums.TransactionType;
import com.financas.app.dto.response.DashboardSummaryResponse;
import com.financas.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final InvoiceRepository invoiceRepository;
    private final CreditCardRepository creditCardRepository;
    private final UserRepository userRepository;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            return ResponseEntity.ok(new DashboardSummaryResponse(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of()));
        }

        UUID userId = user.getId();
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = now.with(TemporalAdjusters.lastDayOfMonth());

        // 1. Saldo em Contas
        BigDecimal totalBalance = accountRepository.findByUserIdAndIsActiveTrue(userId).stream()
                .map(Account::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Transações do mês
        List<Transaction> monthTransactions = transactionRepository.findByUserIdAndDateBetween(userId, startOfMonth, endOfMonth);

        BigDecimal monthIncome = monthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthExpense = monthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Faturas abertas do mês atual (ou vencidas em aberto até o mês atual)
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();

        BigDecimal openInvoicesTotal = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getCreditCard().getUser().getId().equals(userId))
                .filter(inv -> inv.getStatus() == InvoiceStatus.OPEN)
                .filter(inv -> {
                    if (inv.getReferenceYear() < currentYear) return true;
                    if (inv.getReferenceYear() == currentYear && inv.getReferenceMonth() <= currentMonth) return true;
                    return false;
                })
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Detalhamento por categoria
        Map<String, BigDecimal> byCategory = new HashMap<>();
        Map<String, String> categoryColors = new HashMap<>();

        for (Transaction t : monthTransactions) {
            if (t.getType() == TransactionType.EXPENSE && t.getCategory() != null) {
                String catName = t.getCategory().getName();
                byCategory.merge(catName, t.getAmount(), BigDecimal::add);
                categoryColors.putIfAbsent(catName, t.getCategory().getColor());
            }
        }

        BigDecimal totalCatAmount = byCategory.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        List<DashboardSummaryResponse.CategoryBreakdown> breakdowns = new ArrayList<>();

        for (Map.Entry<String, BigDecimal> entry : byCategory.entrySet()) {
            double pct = totalCatAmount.compareTo(BigDecimal.ZERO) > 0
                    ? entry.getValue().divide(totalCatAmount, 4, RoundingMode.HALF_UP).doubleValue() * 100
                    : 0.0;
            breakdowns.add(new DashboardSummaryResponse.CategoryBreakdown(
                    entry.getKey(),
                    categoryColors.getOrDefault(entry.getKey(), "#6B7280"),
                    entry.getValue(),
                    pct
            ));
        }

        return ResponseEntity.ok(new DashboardSummaryResponse(
                totalBalance,
                monthIncome,
                monthExpense,
                openInvoicesTotal,
                breakdowns
        ));
    }

    @PostMapping("/reset-all")
    public ResponseEntity<Map<String, String>> resetAllData() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user != null) {
            UUID userId = user.getId();
            // 1. Apaga todas as transações do usuário
            List<Transaction> txs = transactionRepository.findByUserIdOrderByDateDesc(userId);
            transactionRepository.deleteAll(txs);

            // 2. Zera as faturas dos cartões
            List<CreditCard> cards = creditCardRepository.findByUserIdAndIsActiveTrue(userId);
            for (CreditCard c : cards) {
                List<Invoice> invs = invoiceRepository.findByCreditCardIdOrderByReferenceYearDescReferenceMonthDesc(c.getId());
                for (Invoice inv : invs) {
                    inv.setTotalAmount(BigDecimal.ZERO);
                    invoiceRepository.save(inv);
                }
            }

            // 3. Zera o saldo das contas
            List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrue(userId);
            for (Account acc : accounts) {
                acc.setCurrentBalance(BigDecimal.ZERO);
                acc.setInitialBalance(BigDecimal.ZERO);
                accountRepository.save(acc);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Todos os dados financeiros foram resetados com sucesso!"));
    }
}

