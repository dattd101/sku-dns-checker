# SKU DNS Checker

Next.js 15 website/domain analyzer. Giao diện light theme.

## WHO Domain

Người dùng chỉ nhập domain hoặc subdomain. Backend tự xác định tên miền đăng ký và chọn nguồn tra cứu phù hợp:
- `.vn`: WHOIS .VN qua BKNS Whois API (nguồn dữ liệu .vn từ VNNIC theo tài liệu nhà cung cấp).
- TLD quốc tế: RDAP theo IANA bootstrap.

Có thể đặt `BKNS_WHOIS_API_KEY` trên Vercel để dùng key riêng. Nếu không đặt, project dùng demo key công khai của BKNS (giới hạn thấp).

## Chạy

```bash
npm install
npm run dev
```

## Vercel

Node.js 20+. Nếu có key BKNS riêng, thêm Environment Variable `BKNS_WHOIS_API_KEY`.

Phát triển bởi Sku.
