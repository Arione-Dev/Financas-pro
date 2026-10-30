package com.financas.app.domain;

import com.financas.app.domain.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // Se null, é global padrão
    private User user;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String icon = "tag";

    @Column(length = 7)
    @Builder.Default
    private String color = "#6B7280";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransactionType type = TransactionType.EXPENSE;
}

