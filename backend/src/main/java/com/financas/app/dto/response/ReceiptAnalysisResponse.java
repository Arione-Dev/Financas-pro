package com.financas.app.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReceiptAnalysisResponse(
    String establishment,
    BigDecimal amount,
    LocalDate date,
    String category,
    String suggestedPaymentMethod,
    Integer suggestedInstallments,
    List<ReceiptItem> items,
    String rawJson
) {
    public record ReceiptItem(
        String name,
        BigDecimal price,
        Integer quantity
    ) {}
}

