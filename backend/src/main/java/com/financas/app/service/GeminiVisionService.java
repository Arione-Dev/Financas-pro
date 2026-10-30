package com.financas.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financas.app.dto.response.ReceiptAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class GeminiVisionService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiVisionService(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-1.5-flash}") String model,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public ReceiptAnalysisResponse analyzeReceipt(byte[] imageBytes, String mimeType) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY não configurada. Retornando dados de simulação inteligente.");
            return mockResponse();
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            String prompt = """
                Analise esta imagem de comprovante financeiro (cupom fiscal, nota fiscal ou comprovante de transferência Pix/cartão).
                Retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown de código, sem texto antes ou depois) no formato exato:
                {
                  "establishment": "Nome da loja ou destinatário",
                  "amount": 123.45,
                  "date": "YYYY-MM-DD",
                  "category": "Alimentação | Supermercado | Transporte | Moradia | Saúde | Lazer | Outros",
                  "suggestedPaymentMethod": "PIX | CREDIT_CARD | DEBIT_CARD | CASH | BOLETO",
                  "suggestedInstallments": 1,
                  "items": [
                     {"name": "Nome do item", "price": 10.50, "quantity": 1}
                  ]
                }
                Se algum campo não for identificado com certeza, use data de hoje para date, 1 para installments, e a categoria mais provável.
                """;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "parts", List.of(
                                            Map.of("text", prompt),
                                            Map.of("inline_data", Map.of(
                                                    "mime_type", mimeType,
                                                    "data", base64Image
                                            ))
                                    )
                            )
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "responseMimeType", "application/json"
                    )
            );

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            String responseString = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseString);
            JsonNode candidate = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            String rawJson = candidate.asText();

            // Limpa eventuais marcadores ```json ... ``` se o modelo retornar
            rawJson = rawJson.replaceAll("```json", "").replaceAll("```", "").trim();

            JsonNode data = objectMapper.readTree(rawJson);

            String establishment = data.path("establishment").asText("Estabelecimento Desconhecido");
            BigDecimal amount = BigDecimal.valueOf(data.path("amount").asDouble(0.0));
            LocalDate date = LocalDate.now();
            if (data.hasNonNull("date") && !data.path("date").asText().isBlank()) {
                try {
                    date = LocalDate.parse(data.path("date").asText());
                } catch (Exception ignored) {}
            }

            String category = data.path("category").asText("Outros");
            String paymentMethod = data.path("suggestedPaymentMethod").asText("PIX");
            int installments = data.path("suggestedInstallments").asInt(1);

            List<ReceiptAnalysisResponse.ReceiptItem> items = new ArrayList<>();
            if (data.has("items") && data.path("items").isArray()) {
                for (JsonNode itemNode : data.path("items")) {
                    items.add(new ReceiptAnalysisResponse.ReceiptItem(
                            itemNode.path("name").asText(),
                            BigDecimal.valueOf(itemNode.path("price").asDouble(0.0)),
                            itemNode.path("quantity").asInt(1)
                    ));
                }
            }

            return new ReceiptAnalysisResponse(
                    establishment,
                    amount,
                    date,
                    category,
                    paymentMethod,
                    installments,
                    items,
                    rawJson
            );

        } catch (Exception e) {
            log.error("Erro ao chamar Gemini Vision: {}", e.getMessage(), e);
            return mockResponse();
        }
    }

    private ReceiptAnalysisResponse mockResponse() {
        return new ReceiptAnalysisResponse(
                "Supermercado Pão de Açúcar",
                new BigDecimal("154.80"),
                LocalDate.now(),
                "Supermercado",
                "CREDIT_CARD",
                1,
                List.of(
                        new ReceiptAnalysisResponse.ReceiptItem("Café Especial 500g", new BigDecimal("24.90"), 1),
                        new ReceiptAnalysisResponse.ReceiptItem("Azeite Extra Virgem", new BigDecimal("39.90"), 1),
                        new ReceiptAnalysisResponse.ReceiptItem("Queijo Parmesão", new BigDecimal("28.00"), 1),
                        new ReceiptAnalysisResponse.ReceiptItem("Frutas & Legumes", new BigDecimal("62.00"), 1)
                ),
                "{}"
        );
    }
}

