package com.financas.app.dto.response;

import java.util.UUID;

public record AuthResponse(
    UUID id,
    String name,
    String email,
    String avatarUrl,
    String token
) {}
