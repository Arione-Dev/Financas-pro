package com.financas.app.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
    BigDecimal totalBalance,
    BigDecimal monthIncome,
    BigDecimal monthExpense,
    BigDecimal openInvoicesTotal,
    List<CategoryBreakdown> categoryExpenses
) {
    public record CategoryBreakdown(
        String name,
        String color,
        BigDecimal amount,
        Double percentage
    ) {}
}

