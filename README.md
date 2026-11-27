# Hướng Dẫn Sử Dụng G1 ACQ Shadowrocket Module & Bảng Điều Khiển PC (`v7.13.0`)

Bộ công cụ giúp bắt gói phản hồi trang nâng cấp Google One / Gemini (`https://one.google.com/ai`), thu thập mã SKU gốc, ghi đè sang các mã khuyến mãi ẩn trên App Store iOS (như **Google AI Pro 5TB giảm 99% 3 tháng đầu**, **Ultra 20TB / 30TB giá cũ Thổ Nhĩ Kỳ**), điều khiển trực tiếp từ máy tính (`0ms` qua mạng Wi-Fi LAN) và tự động cập nhật mẫu mới từ 2 repo gốc (`crhywun/g1-acq` & `Dgkncn/g1-acq-plus`).

---

## 1. Cấu Trúc Thư Mục Gọn Nhẹ (Mang Sang Máy Khác Dùng Ngay)

```text
G1-ACQ-PC-Dashboard/
├── 1_Chay_Dashboard_PC.bat          # Bấm đúp để bật Server điều khiển + mở Web http://localhost:8787
├── 2_Mo_Cong_Firewall_LAN_8787.bat  # Chạy 1 lần trên máy mới để mở cổng tường lửa Windows cho iPhone kết nối
├── HUONG_DAN_SU_DUNG.html           # Bản hướng dẫn giao diện Web (bấm đúp mở đọc ngay bằng trình duyệt)
├── HUONG_DAN_SU_DUNG.md             # Bản hướng dẫn định dạng Markdown
├── pc-server.cjs                    # Máy chủ Node.js (Tự nhận IP LAN, phát .sgmodule động, Auto-Update Repo Gốc)
├── pc-dashboard.html                # Giao diện Web Điều Khiển 4 Tab
├── remote-config.json               # Cấu hình quy tắc đang kích hoạt
├── g1-acq.js                        # Script Runtime bắt gói & ghi đè SKU cho Shadowrocket
├── g1-sku-report.js                 # Script Trang quản lý cục bộ trên Safari iPhone (one.google.com/g1-sku-report)
├── lib/mapping-config.js            # Thư viện lõi chứa quy tắc & bộ mẫu Tiếng Việt
└── tools/build-variants.cjs         # Công cụ đồng bộ khi nâng cấp mã nguồn
```

---

## 2. Cài Đặt Trên Máy Tính Mới (Chỉ Mất 1 Phút)

1. **Cài đặt Node.js** (nếu máy tính chưa có):
   - Tải bản **Node.js LTS** (từ `v18` trở lên, khuyến nghị `v20` / `v22`) tại [https://nodejs.org](https://nodejs.org) rồi bấm *Next* cài đặt bình thường. *(Không cần cài thêm thư viện `npm install` hay cài Git)*.
2. **Mở cổng kết nối mạng LAN cho iPhone (chỉ cần chạy 1 lần đầu)**:
   - Bấm đúp vào file **`2_Mo_Cong_Firewall_LAN_8787.bat`** → Chọn **Yes** khi Windows hỏi quyền Admin để cho phép cổng `TCP 8787` đi qua tường lửa Windows.
3. **Khởi động Bảng Điều Khiển PC**:
   - Bấm đúp vào file **`1_Chay_Dashboard_PC.bat`**.
   - Giữ cửa sổ đen chạy nền; trình duyệt sẽ tự mở địa chỉ **`http://localhost:8787`**.

---

## 3. Cài Đặt Shadowrocket Trên iPhone / iPad

Đảm bảo **iPhone và Máy tính đang bắt chung 1 mạng Wi-Fi**.

### Bước 3.1 — Bật Giải Mã HTTPS (MITM) Trong Shadowrocket *(Bắt buộc làm 1 lần)*
Nếu chưa bật giải mã HTTPS và tin cậy chứng chỉ, Shadowrocket sẽ không đọc được nội dung `one.google.com`:
1. Mở **Shadowrocket** → vào tab **Cấu hình (Config)** → bấm chữ **`(i)`** ở dòng cấu hình đang dùng → chọn **Giải mã HTTPS (HTTPS Decryption)**.
2. Bật công tắc **Giải mã HTTPS** lên.
3. Bấm **Tạo chứng chỉ CA mới (Generate New CA Certificate)** → **Cài đặt chứng chỉ (Install Certificate)** → Cho phép tải hồ sơ về máy.
4. Vào **Cài đặt iPhone (Settings)** → **Đã tải về hồ sơ (Profile Downloaded)** → Bấm **Cài đặt (Install)** chứng chỉ Shadowrocket.
5. **Quan trọng nhất**: Vào **Cài đặt chung (General)** → **Giới thiệu (About)** → kéo xuống cuối chọn **Cài đặt tin cậy chứng chỉ (Certificate Trust Settings)** → **Bật xanh** dòng chứng chỉ gốc của Shadowrocket!

### Bước 3.2 — Thêm Module G1 ACQ Vào Shadowrocket
1. Nhìn lên thanh màu xanh đầu trang **`http://localhost:8787`** trên máy tính, bấm nút **`📋 Copy Link Module LAN`** (có dạng `http://192.168.x.x:8787/g1-acq-live.sgmodule` — máy chủ đã tự điền đúng IP của máy tính đó).
2. Gửi link đó sang iPhone → Mở **Shadowrocket** → Tab **Mô-đun (Module)** → Bấm dấu **`+` (Thêm Mô-đun)** ở góc trên phải → Dán link vào và bấm **OK**.
3. Đảm bảo chỉ bật **1 module G1 ACQ duy nhất** (tắt các module G1 cũ nếu có để tránh xung đột), sau đó gạt nút **Bật kết nối VPN Shadowrocket** ở trang chủ.

---

## 4. Cách Sử Dụng 4 Tab Trên Bảng Điều Khiển PC (`http://localhost:8787`)

### ⚡ Tab 1: Chọn Bộ Mẫu Gói (Presets)
- Chứa sẵn các mẫu đã kiểm chứng sống trên iOS và tự động gộp thêm các mẫu mới từ Repo Gốc:
  - **Mẫu số 1 (`pro-1yuan-20tb`)**: Thay nút **Ultra 20TB** (`g1.ios.20tb.m.v2`) thành gói **Google AI Pro (5 TB) giảm 99% trong 3 tháng đầu** (`com.google.gemini.2tb.ai.m.3month_ip_99p`).
  - **Mẫu số 2 (`pro-1yuan-2tb` · Chuẩn `v7.13.0`)**: Thay cả 2 mã Pro Tháng (`g1.ios.2tb.ai.m` và `g1.ios.ai.2tb.m.ip_3mo_75p.acq`) thành gói **Google AI Pro giảm 99%** (dành cho tài khoản không hiện nút Ultra 20TB).
  - **Mẫu số 3 (`tr-ultra-legacy`)**: Mở lại **Ultra 20TB / 30TB giá cũ** (`g1.ios.20tb.m` `1989.99 TRY` / `g1.ios.30tb.m` `2949.99 TRY` trên Apple ID Thổ Nhĩ Kỳ).
  - **Các bộ Dò 10 Nút (Gói A / B / C / D)**: Gắn 10 mã ẩn vào 10 nút trên trang để dò mã mới.
- **Thao tác**:
  1. Bấm **`⚡ Áp dụng mẫu này cho iPhone`** trên máy tính.
  2. Trên iPhone, **vuốt đóng hẳn ứng dụng Google (biểu tượng chữ G) hoặc Gemini**, mở lại ứng dụng → Bấm vào ảnh đại diện → **Nâng cấp / Quản lý gói Google One** → Bấm nút gói tương ứng để bật bảng thanh toán Apple Pay!

### 🛠️ Tab 2: Quản Lý & Sửa Tay Quy Tắc
- Sửa trực tiếp từng dòng `Kiểu khớp (Exact / Prefix)`, `Mã SKU Gốc (From)` và `Mã SKU Đích (To)`.
- Lưu ý: Nên dùng **`Exact (Khớp 1-1)`** và mỗi nút nguồn gắn 1 mã đích khác nhau để tránh lỗi Google One ẩn nút khi bị trùng mã đích trên cùng 1 trang.

### 📡 Tab 3: Nhật Ký Bắt Gói · SKU Gốc · Log Runtime
- Theo dõi trực tiếp theo thời gian thực mỗi khi iPhone mở trang gói Google One:
  1. **Bảng 1 — Nhật Ký Bắt Gói & Ghi Đè SKU**: Hiện giờ bắt gói, IP của iPhone, đường dẫn URL và chính xác cặp `SKU Gốc ━━► SKU Đích ×Số lần`.
  2. **Bảng 2 — Kho Mã SKU Gốc Thu Thập Được**: Toàn bộ các mã SKU gốc mà Google trả về cho tài khoản đó. Bấm **`+ Dùng làm SKU gốc`** để đưa ngay sang Tab 2.
  3. **Bảng 3 — Console Log Runtime**: Luồng log thực thi chi tiết của script.

### 🔄 Tab 4: Tự Động Cập Nhật Repo Gốc
- Cứ mỗi **5 phút** (hoặc khi bấm nút **`🔄 Kiểm tra Repo Gốc`**), máy chủ tự kiểm tra commit mới nhất trên **`crhywun/g1-acq`** và **`Dgkncn/g1-acq-plus`**.
- Nếu tác giả gốc tung ra preset mới hoặc mã SKU khuyến mãi mới, hệ thống tự động tải về và đưa thẳng vào Tab 1 & Tab 4 mà bạn không cần tải lại bộ code thủ công.

---

## 5. Dùng Độc Lập Trên iPhone Khi Không Bật Máy Tính

Ngay cả khi tắt máy tính hoặc mang iPhone ra ngoài dùng 4G:
- Script trong Shadowrocket tự động rơi về đọc cấu hình lưu trong bộ nhớ cục bộ của iPhone (`$persistentStore`).
- Bạn vẫn có thể đổi mẫu trực tiếp ngay trên iPhone bằng cách mở trình duyệt **Safari** truy cập địa chỉ ảo:
  👉 **`https://one.google.com/g1-sku-report`**

---

## 6. Xử Lý Sự Cố Thường Gặp

1. **Mở Google App trên iPhone nhưng Tab 3 trên PC không nhảy gói tin mới?**
   - Kiểm tra iPhone và PC có đang chung mạng Wi-Fi không (nếu PC cắm dây mạng LAN còn iPhone bắt Wi-Fi khác lớp mạng, hãy kiểm tra hộp chọn Card mạng LAN trên đầu trang Dashboard).
   - Chạy file **`2_Mo_Cong_Firewall_LAN_8787.bat`** trên máy tính để đảm bảo Windows Firewall không chặn cổng `8787`.
   - Kiểm tra mục **Cài đặt tin cậy chứng chỉ (Certificate Trust Settings)** trên iPhone đã bật xanh chứng chỉ Shadowrocket chưa.
2. **Bấm nút mua trên iPhone hiện thông báo *"Giao dịch của bạn chưa thể hoàn tất"* trên App Store?**
   - Nghĩa là mã SKU đích đó đã bị Google khóa/gỡ trên iOS App Store (ví dụ các mã `75p.acq` hoặc mã `*_eft` vốn chỉ dành cho Android Google Play). Hãy chuyển sang **Mẫu số 1 / Mẫu số 2 (`com.google.gemini.2tb.ai.m.3month_ip_99p`)** hoặc **Mẫu số 3 (`g1.ios.20tb.m`)**.
3. **Trang nâng cấp trong Google App quay vòng hoặc báo lỗi 502?**
   - Do giao thức QUIC (UDP 443). Trong module đã tích hợp sẵn dòng chặn `UDP 443` để ép hạ xuống TCP giúp MITM ổn định; chỉ cần tắt bật lại VPN Shadowrocket và mở lại Google App.
