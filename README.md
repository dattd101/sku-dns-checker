# Domain Inspector — Next.js 15

Self-hosted SEO + HTTP + DNS + TLS/domain analyzer. Không dùng API trả phí.

## Có sẵn
- SEO: title, description, canonical, robots meta, lang, H1-H6, OpenGraph/Twitter, word count, score/issues
- Links: internal/external/nofollow (tối đa 300 item trong response)
- Images: src/alt/missing alt
- HTTP: status, redirect chain, headers, response time, HTML size
- DNS: A, AAAA, MX, NS, TXT, CNAME, SOA, SPF, DMARC
- TLS/SSL: issuer/subject, protocol, validity, fingerprint, days remaining
- Security headers: CSP, HSTS, XCTO, X-Frame-Options, Referrer-Policy, Permissions-Policy
- robots.txt + sitemap.xml presence
- SSRF guard: chặn localhost/private/reserved IP và kiểm tra lại mỗi redirect

## Chạy
```bash
npm install
npm run dev
```
Mở http://localhost:3000

## Production
```bash
npm run build
npm start
```

> Nên deploy trên VPS/container Node.js. Một số serverless host có thể hạn chế raw DNS/TLS socket hoặc timeout ngắn.

## Chưa bật mặc định
Broken-link crawling toàn site, WHOIS port 43, RDAP, GeoIP MMDB, Lighthouse/Chromium. Các phần này nên chạy worker/queue riêng vì tốn tài nguyên và dễ bị abuse.

## Security
Tool nhận URL tùy ý nên SSRF là rủi ro chính. Code hiện chặn private/reserved address và revalidate redirect. Khi public internet, nên bổ sung rate limit, auth/API key, queue, egress firewall, max concurrency và logging.

## GeoIP
- Domain GEO tự resolve domain -> public IP rồi tra City/Region/Postal/Country/Lat/Lon/ISP/ASN.
- IP GEO tự thử lấy public IP của trình duyệt bằng api.ipify.org và cho phép nhập IP/domain thủ công.
- Geo metadata dùng endpoint miễn phí ipwho.is, không cần API key. Nếu endpoint tạm lỗi/rate-limit, UI báo không lấy được dữ liệu thay vì tạo dữ liệu giả.
