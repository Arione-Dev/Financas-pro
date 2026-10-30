package com.financas.app.dto.request;

public record RegisterRequest(
    String name,
    String email,
    String password
) {}
