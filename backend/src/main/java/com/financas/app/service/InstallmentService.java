package com.financas.app.service;

import com.financas.app.domain.CreditCard;
import com.financas.app.domain.Invoice;
import com.financas.app.domain.enums.InvoiceStatus;
import com.financas.app.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InstallmentService {

    private final InvoiceRepository invoiceRepository;

    /**
     * Localiza ou cria a fatura de um determinado mês/ano para um cartão de crédito.
     */
    @Transactional
    public Invoice getOrCreateInvoice(CreditCard card, int targetMonth, int targetYear) {
        return invoiceRepository
                .findByCreditCardIdAndReferenceMonthAndReferenceYear(card.getId(), targetMonth, targetYear)
                .orElseGet(() -> {
                    YearMonth ym = YearMonth.of(targetYear, targetMonth);
                    int closingDay = Math.min(card.getClosingDay(), ym.lengthOfMonth());
                    LocalDate closingDate = ym.atDay(closingDay);

                    // Se vencimento for menor que fechamento, cai no mês seguinte
                    YearMonth dueYm = card.getDueDay() < card.getClosingDay() ? ym.plusMonths(1) : ym;
                    int dueDay = Math.min(card.getDueDay(), dueYm.lengthOfMonth());
                    LocalDate dueDate = dueYm.atDay(dueDay);

                    Invoice newInvoice = Invoice.builder()
                            .creditCard(card)
                            .referenceMonth(targetMonth)
                            .referenceYear(targetYear)
                            .closingDate(closingDate)
                            .dueDate(dueDate)
                            .status(InvoiceStatus.OPEN)
                            .totalAmount(BigDecimal.ZERO)
                            .build();

                    return invoiceRepository.save(newInvoice);
                });
    }

    /**
     * Determina a primeira fatura com base na data da compra e no dia de fechamento do cartão.
     */
    public YearMonth calculateInitialInvoicePeriod(CreditCard card, LocalDate purchaseDate) {
        int closingDay = card.getClosingDay();
        YearMonth purchaseYm = YearMonth.from(purchaseDate);

        // Se a compra foi feita após o dia de fechamento, a 1ª parcela vai para o mês seguinte
        if (purchaseDate.getDayOfMonth() >= closingDay) {
            return purchaseYm.plusMonths(1);
        }
        return purchaseYm;
    }
}

