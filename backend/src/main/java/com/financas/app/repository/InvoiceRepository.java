package com.financas.app.repository;

import com.financas.app.domain.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByCreditCardIdAndReferenceMonthAndReferenceYear(
            UUID creditCardId, Integer referenceMonth, Integer referenceYear);

    List<Invoice> findByCreditCardIdOrderByReferenceYearDescReferenceMonthDesc(UUID creditCardId);
}

