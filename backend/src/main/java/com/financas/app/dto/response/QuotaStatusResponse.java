package com.financas.app.dto.response;

public record QuotaStatusResponse(
    boolean isAllowed,
    long availableTokens,
    long maxTokens,
    long waitSecondsToReset,
    String message
) {}

