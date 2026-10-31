package com.financas.app.dto.request;

import com.financas.app.domain.enums.PaymentMethod;
import com.financas.app.domain.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionCreateRequest(
    String userId,
    String description,
    BigDecimal amount,
    LocalDate date,
    TransactionType type,
    PaymentMethod paymentMethod,
    String accountId,
    String creditCardId,
    String categoryId,
    Integer totalInstallments,
    Boolean isRecurring
) {}

