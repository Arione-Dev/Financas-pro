package com.financas.app.repository;

import com.financas.app.domain.ReceiptLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReceiptLogRepository extends JpaRepository<ReceiptLog, UUID> {
}

