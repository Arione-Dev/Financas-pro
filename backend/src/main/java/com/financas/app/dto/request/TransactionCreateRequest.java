package com.financas.app.dto.request;

import com.financas.app.domain.enums.PaymentMethod;
import com.financas.app.domain.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionCreateRequest(
    UUID userId,
    String description,
    BigDecimal amount,
    LocalDate date,
    TransactionType type,
    PaymentMethod paymentMethod,
    UUID accountId,
    UUID creditCardId,
    UUID categoryId,
    Integer totalInstallments,
    Boolean isRecurring
) {}

