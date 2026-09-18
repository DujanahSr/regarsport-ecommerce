package com.regarsport.payment.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

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

        if (toEmail == null || toEmail.trim().isEmpty() || !toEmail.contains("@")) {
            log.warn("Invalid email address for order {}: {}", orderNumber, toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("no-reply@regarsport.com", "RegarSport Official Store");
            helper.setTo(toEmail.trim());
            helper.setSubject("Faktur Pembelian Resmi - Pesanan #" + orderNumber + " [LUNAS]");

            NumberFormat idrFormat = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
            String formattedAmount = idrFormat.format(amount != null ? amount : BigDecimal.ZERO)
                    .replace(",00", "")
                    .replace("Rp", "Rp ");

            String paymentDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy HH:mm", new Locale("id", "ID")));
            String displayPaymentType = (paymentType != null ? paymentType.toUpperCase() : "MIDTRANS ONLINE PAYMENT");

            String htmlBody = String.format("""
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                        .header { background: linear-gradient(135deg, #022c22 0%%, #064e3b 100%%); color: white; padding: 32px 28px; text-align: center; }
                        .content { padding: 32px 28px; }
                        .badge-paid { display: inline-block; background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 9999px; border: 1px solid #bbf7d0; text-transform: uppercase; margin-bottom: 16px; }
                        .order-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
                        .order-table { width: 100%%; border-collapse: collapse; font-size: 13px; }
                        .order-table td { padding: 8px 0; }
                        .total-row { border-top: 1px dashed #cbd5e1; font-weight: bold; font-size: 16px; color: #047857; }
                        .btn-track { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: bold; border-radius: 10px; margin-top: 20px; text-align: center; }
                        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">PT REGARSPORT INDONESIA</h1>
                          <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px;">Official Athletic Gear & Custom Apparel</p>
                        </div>
                        <div class="content">
                          <div style="text-align: center;">
                            <span class="badge-paid">&#10004; Pembayaran Terverifikasi (Lunas)</span>
                            <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">Terima Kasih, %s!</h2>
                            <p style="margin: 0; color: #64748b; font-size: 14px;">Pesanan Anda telah berhasil dibayar dan saat ini sedang disiapkan oleh tim gudang untuk segera dikirim.</p>
                          </div>

                          <div class="order-box">
                            <table class="order-table">
                              <tr>
                                <td style="color: #64748b;">Nomor Pesanan:</td>
                                <td style="text-align: right; font-weight: bold; font-family: monospace; color: #0f172a;">%s</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b;">Waktu Transaksi:</td>
                                <td style="text-align: right; color: #334155;">%s WIB</td>
                              </tr>
                              <tr>
                                <td style="color: #64748b;">Metode Pembayaran:</td>
                                <td style="text-align: right; font-weight: 600; color: #334155;">%s</td>
                              </tr>
                              <tr class="total-row">
                                <td style="padding-top: 14px;">Total Tagihan:</td>
                                <td style="text-align: right; padding-top: 14px; font-size: 18px; color: #059669;">%s</td>
                              </tr>
                            </table>
                          </div>

                          <div style="text-align: center;">
                            <a href="http://localhost:5173/dashboard/my-orders" class="btn-track">Lihat & Lacak Pesanan Saya &rarr;</a>
                          </div>

                          <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
                            <p style="margin: 0 0 4px 0;"><strong>Catatan Penting:</strong></p>
                            <p style="margin: 0; line-height: 1.5;">Invoice digital resmi dapat Anda unduh dalam format PDF atau dicetak langsung kapan saja melalui menu <em>Pesanan Saya</em> di aplikasi.</p>
                          </div>
                        </div>
                        <div class="footer">
                          &copy; 2026 PT RegarSport Indonesia. Jl. Jenderal Sudirman No. 45, Wonogiri, Jawa Tengah.<br>
                          Email ini dikirim otomatis oleh sistem e-commerce terdistribusi RegarSport.
                        </div>
                      </div>
                    </body>
                    </html>
                    """,
                    customerName != null ? customerName : "Pelanggan",
                    orderNumber,
                    paymentDate,
                    displayPaymentType,
                    formattedAmount
            );

            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email receipt sent successfully for order: {} to {}", orderNumber, toEmail);

        } catch (Exception e) {
            log.warn("Failed to send email receipt for order: {} (mail server might be offline): {}", orderNumber, e.getMessage());
        }
    }
}
