package com.regarsport.payment.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Async
    public void sendPaymentReceiptEmail(
            String toEmail,
            String customerName,
            String orderNumber,
            BigDecimal amount,
            String paymentType
    ) {
        log.info("Sending payment receipt email to: {} for order: {}", toEmail, orderNumber);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("no-reply@regarsport.com");
            helper.setTo(toEmail);
            helper.setSubject("RegarSport - Bukti Pembayaran Pesanan #" + orderNumber);

            String htmlBody = String.format("""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                      <div style="background-color: #0f172a; color: white; padding: 24px; text-align: center;">
                        <h2 style="margin: 0;">REGARSPORT STORE</h2>
                        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Bukti Pembayaran Berhasil</p>
                      </div>
                      <div style="padding: 24px;">
                        <p>Halo <strong>%s</strong>,</p>
                        <p>Terima kasih! Pembayaran untuk pesanan Anda telah kami terima.</p>
                        <table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Nomor Pesanan:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">%s</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Metode Pembayaran:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">%s</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b;">Total Dibayar:</td>
                            <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #16a34a; text-align: right;">Rp %s</td>
                          </tr>
                        </table>
                        <p style="font-size: 14px; color: #64748b;">Pesanan Anda saat ini sedang disiapkan untuk dikirim. Anda dapat memantau status pesanan di dashboard profil.</p>
                      </div>
                      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                        &copy; 2026 RegarSport. All rights reserved.
                      </div>
                    </div>
                    """, customerName, orderNumber, paymentType != null ? paymentType.toUpperCase() : "MIDTRANS", amount.toPlainString());

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email receipt sent successfully for order: {}", orderNumber);

        } catch (Exception e) {
            log.warn("Failed to send email receipt for order: {} (mail server might be offline): {}", orderNumber, e.getMessage());
        }
    }
}
