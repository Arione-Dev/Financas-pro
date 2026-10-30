package com.financas.app.controller;

import com.financas.app.domain.Category;
import com.financas.app.domain.User;
import com.financas.app.domain.enums.TransactionType;
import com.financas.app.repository.CategoryRepository;
import com.financas.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Category>> listCategories() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        UUID userId = user != null ? user.getId() : UUID.randomUUID();
        List<Category> list = categoryRepository.findByUserIdOrGlobal(userId);
        if (list.isEmpty()) {
            list = seedDefaultCategories();
        }
        return ResponseEntity.ok(list);
    }

    private List<Category> seedDefaultCategories() {
        List<Category> defaults = List.of(
                Category.builder().name("Alimentação").icon("utensils").color("#F59E0B").type(TransactionType.EXPENSE).build(),
                Category.builder().name("Supermercado").icon("shopping-cart").color("#10B981").type(TransactionType.EXPENSE).build(),
                Category.builder().name("Transporte").icon("car").color("#3B82F6").type(TransactionType.EXPENSE).build(),
                Category.builder().name("Moradia").icon("home").color("#8B5CF6").type(TransactionType.EXPENSE).build(),
                Category.builder().name("Saúde").icon("heart-pulse").color("#EC4899").type(TransactionType.EXPENSE).build(),
                Category.builder().name("Lazer").icon("gamepad-2").color("#06B6D4").type(TransactionType.EXPENSE).build(),
                Category.builder().name("Salário").icon("wallet").color("#10B981").type(TransactionType.INCOME).build(),
                Category.builder().name("Investimentos").icon("trending-up").color("#6366F1").type(TransactionType.INCOME).build()
        );
        return categoryRepository.saveAll(defaults);
    }
}

