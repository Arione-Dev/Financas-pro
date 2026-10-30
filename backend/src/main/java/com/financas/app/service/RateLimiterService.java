package com.financas.app.service;

import com.financas.app.dto.response.QuotaStatusResponse;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimiterService {

    private final Bucket geminiBucket;
    private final long maxTokens;

    public RateLimiterService(@Value("${app.gemini.rate-limit.requests-per-minute:15}") long requestsPerMinute) {
        this.maxTokens = requestsPerMinute;
        Bandwidth limit = Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillGreedy(requestsPerMinute, Duration.ofMinutes(1))
                .build();
        this.geminiBucket = Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Tenta consumir 1 token para ler um comprovante.
     * Se não tiver tokens, calcula exatamente quantos segundos faltam para zerar.
     */
    public QuotaStatusResponse tryConsume() {
        ConsumptionProbe probe = geminiBucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            return new QuotaStatusResponse(
                    true,
                    probe.getRemainingTokens(),
                    maxTokens,
                    0,
                    "Requisição permitida."
            );
        } else {
            long waitSeconds = Math.max(1, Duration.ofNanos(probe.getNanosToWaitForRefill()).toSeconds());
            return new QuotaStatusResponse(
                    false,
                    0,
                    maxTokens,
                    waitSeconds,
                    "Limite de 15 leituras/min atingido. Aguarde " + waitSeconds + "s para tentar novamente."
            );
        }
    }

    /**
     * Consulta o status atual da cota sem gastar token.
     */
    public QuotaStatusResponse getStatus() {
        long available = geminiBucket.getAvailableTokens();
        return new QuotaStatusResponse(
                available > 0,
                available,
                maxTokens,
                0,
                available > 0 ? "Leituras disponíveis." : "Aguardando renovação de cota."
        );
    }
}

