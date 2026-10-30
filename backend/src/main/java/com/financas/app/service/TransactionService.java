package com.financas.app.service;

import com.financas.app.domain.*;
import com.financas.app.domain.enums.PaymentMethod;
import com.financas.app.domain.enums.TransactionType;
import com.financas.app.dto.request.TransactionCreateRequest;
import com.financas.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CreditCardRepository creditCardRepository;
    private final InvoiceRepository invoiceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final InstallmentService installmentService;

    @Transactional
    public List<Transaction> createTransaction(TransactionCreateRequest req) {
        User user = (req.userId() != null)
                ? userRepository.findById(req.userId()).orElseThrow()
                : userRepository.findAll().stream().findFirst().orElseGet(this::createDefaultUser);

        Category category = (req.categoryId() != null)
                ? categoryRepository.findById(req.categoryId()).orElse(null)
                : null;

        LocalDate transactionDate = req.date() != null ? req.date() : LocalDate.now();
        List<Transaction> created = new ArrayList<>();

        // 1. Pagamento via Cartão de Crédito (com parcelamento inteligente)
        if (req.paymentMethod() == PaymentMethod.CREDIT_CARD && req.creditCardId() != null) {
            CreditCard card = creditCardRepository.findById(req.creditCardId()).orElseThrow();
            int installments = (req.totalInstallments() != null && req.totalInstallments() > 1) ? req.totalInstallments() : 1;

            UUID groupId = installments > 1 ? UUID.randomUUID() : null;
            BigDecimal totalAmount = req.amount();
            BigDecimal baseInstallmentAmount = totalAmount.divide(BigDecimal.valueOf(installments), 2, RoundingMode.DOWN);
            BigDecimal remainder = totalAmount.subtract(baseInstallmentAmount.multiply(BigDecimal.valueOf(installments)));

            YearMonth startYm = installmentService.calculateInitialInvoicePeriod(card, transactionDate);

            for (int i = 1; i <= installments; i++) {
                YearMonth currentYm = startYm.plusMonths(i - 1);
                Invoice invoice = installmentService.getOrCreateInvoice(card, currentYm.getMonthValue(), currentYm.getYear());

                BigDecimal currentInstallmentAmount = (i == 1) ? baseInstallmentAmount.add(remainder) : baseInstallmentAmount;

                String desc = req.description();
                if (installments > 1) {
                    desc = desc + " (" + i + "/" + installments + ")";
                }

                Transaction t = Transaction.builder()
                        .user(user)
                        .creditCard(card)
                        .invoice(invoice)
                        .category(category)
                        .type(TransactionType.EXPENSE)
                        .paymentMethod(PaymentMethod.CREDIT_CARD)
                        .description(desc)
                        .amount(currentInstallmentAmount)
                        .date(transactionDate.plusMonths(i - 1))
                        .installmentGroupId(groupId)
                        .installmentNumber(i)
                        .totalInstallments(installments)
                        .isPaid(false)
                        .isRecurring(Boolean.TRUE.equals(req.isRecurring()))
                        .build();

                created.add(transactionRepository.save(t));

                // Atualiza o valor acumulado da fatura
                invoice.setTotalAmount(invoice.getTotalAmount().add(currentInstallmentAmount));
                invoiceRepository.save(invoice);
            }

            return created;
        }

        // 2. Pagamento à Vista (Pix, Débito, Dinheiro ou Receita em Conta)
        Account account = null;
        if (req.accountId() != null) {
            account = accountRepository.findById(req.accountId()).orElse(null);
            if (account != null) {
                if (req.type() == TransactionType.EXPENSE) {
                    account.setCurrentBalance(account.getCurrentBalance().subtract(req.amount()));
                } else if (req.type() == TransactionType.INCOME) {
                    account.setCurrentBalance(account.getCurrentBalance().add(req.amount()));
                }
                accountRepository.save(account);
            }
        }

        Transaction t = Transaction.builder()
                .user(user)
                .account(account)
                .category(category)
                .type(req.type() != null ? req.type() : TransactionType.EXPENSE)
                .paymentMethod(req.paymentMethod() != null ? req.paymentMethod() : PaymentMethod.PIX)
                .description(req.description())
                .amount(req.amount())
                .date(transactionDate)
                .isPaid(true)
                .isRecurring(Boolean.TRUE.equals(req.isRecurring()))
                .build();

        created.add(transactionRepository.save(t));
        return created;
    }

    private User createDefaultUser() {
        return userRepository.save(User.builder()
                .name("Usuário Principal")
                .email("admin@financas.app")
                .build());
    }
}

