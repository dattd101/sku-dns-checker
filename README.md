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

## IP Lookup (miễn phí)

Chọn **IP Lookup** trên thanh bên và nhập IPv4 hoặc IPv6 công khai. Chức năng này độc lập với nút Analyze.

- API `POST /api/ip-lookup`, JSON: `{"ip":"103.7.40.159"}`.
- Dùng `ipwho.is` cho ISP, tổ chức, ASN, vị trí; `rdap.org` cho chủ quản và dải IP. Không cần API key.
- Dữ liệu được cache tối đa 1 giờ ở phía Next.js. Nếu một nguồn lỗi, nguồn còn lại vẫn được hiển thị.
- IP private/reserved không được phép tra cứu. Thông tin chủ quản IP **không chứng minh** nơi trực tiếp bán VPS.

Triển khai như ứng dụng Next.js hiện tại trên Vercel; không cần cấu hình biến môi trường.
