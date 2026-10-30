package com.financas.app.controller;

import com.financas.app.domain.ReceiptLog;
import com.financas.app.domain.User;
import com.financas.app.dto.response.QuotaStatusResponse;
import com.financas.app.dto.response.ReceiptAnalysisResponse;
import com.financas.app.repository.ReceiptLogRepository;
import com.financas.app.repository.UserRepository;
import com.financas.app.service.GeminiVisionService;
import com.financas.app.service.RateLimiterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
@Slf4j
public class ReceiptScanController {

    private final RateLimiterService rateLimiterService;
    private final GeminiVisionService geminiVisionService;
    private final ReceiptLogRepository receiptLogRepository;
    private final UserRepository userRepository;

    /**
     * Endpoint para o PWA consultar o status da cota (quantos tokens restam e se tem cronômetro ativo).
     */
    @GetMapping("/quota-status")
    public ResponseEntity<QuotaStatusResponse> getQuotaStatus() {
        return ResponseEntity.ok(rateLimiterService.getStatus());
    }

    /**
     * Endpoint para upload do comprovante (foto do celular, cupom ou PDF).
     */
    @PostMapping("/scan")
    public ResponseEntity<?> scanReceipt(@RequestParam("file") MultipartFile file) {
        // 1. Verifica e consome o token da cota (15 req/min)
        QuotaStatusResponse quota = rateLimiterService.tryConsume();

        if (!quota.isAllowed()) {
            log.warn("Rate limit atingido para envio de comprovante. Aguardar: {}s", quota.waitSecondsToReset());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("X-RateLimit-Reset-In-Seconds", String.valueOf(quota.waitSecondsToReset()))
                    .body(quota);
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("O arquivo enviado está vazio.");
        }

        try {
            byte[] bytes = file.getBytes();
            String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

            // 2. Chama a IA do Gemini Vision
            ReceiptAnalysisResponse analysis = geminiVisionService.analyzeReceipt(bytes, contentType);

            // 3. Salva auditoria no banco
            userRepository.findAll().stream().findFirst().ifPresent(user -> {
                ReceiptLog logEntry = ReceiptLog.builder()
                        .user(user)
                        .filename(file.getOriginalFilename())
                        .extractedData(analysis.rawJson())
                        .status("SUCCESS")
                        .build();
                receiptLogRepository.save(logEntry);
            });

            return ResponseEntity.ok(analysis);

        } catch (IOException e) {
            log.error("Erro ao processar arquivo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao ler imagem enviada.");
        }
    }
}

