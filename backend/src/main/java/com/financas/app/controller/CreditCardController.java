package com.financas.app.controller;

import com.financas.app.domain.CreditCard;
import com.financas.app.domain.Invoice;
import com.financas.app.domain.User;
import com.financas.app.repository.CreditCardRepository;
import com.financas.app.repository.InvoiceRepository;
import com.financas.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CreditCardController {

    private final CreditCardRepository creditCardRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<CreditCard>> listCards() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(creditCardRepository.findByUserIdAndIsActiveTrue(user.getId()));
    }

    @PostMapping
    public ResponseEntity<CreditCard> createCard(@RequestBody CreditCard card) {
        User user = userRepository.findAll().stream().findFirst().orElseGet(() ->
                userRepository.save(User.builder().name("Usuário").email("user@financas.app").build()));
        card.setUser(user);
        return ResponseEntity.ok(creditCardRepository.save(card));
    }

    @GetMapping("/{id}/invoices")
    public ResponseEntity<List<Invoice>> listInvoices(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceRepository.findByCreditCardIdOrderByReferenceYearDescReferenceMonthDesc(id));
    }
}

