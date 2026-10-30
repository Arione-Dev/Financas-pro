package com.financas.app.repository;

import com.financas.app.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByUserIdOrderByDateDesc(UUID userId);

    List<Transaction> findByInvoiceId(UUID invoiceId);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date DESC")
    List<Transaction> findByUserIdAndDateBetween(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}

