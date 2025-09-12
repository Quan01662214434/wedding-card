
Thiệp Cưới Online — MVP tĩnh (5 templates + MB Bank QR)
=======================================================

Tính năng:
- 5 mẫu: classic, floral, minimal, royal (300k) và premium (400k).
- Form đầy đủ: cô dâu, chú rể, ngày giờ, địa điểm, địa chỉ, link Google Maps, tên bố mẹ hai bên, ảnh bìa.
- Preview trực tiếp theo mẫu đã chọn.
- Tạo QR MB Bank (Lâm Trần Quân — STK 0906325133) với đúng giá theo mẫu.
- Xuất link chia sẻ: invitation.html?slug=ten-co-dau-ten-chu-re
- Trang quản lý thiệp (localStorage, trên thiết bị này).

Cách dùng:
1) index.html → chọn mẫu → vào admin.html.
2) admin.html → điền thông tin, upload ảnh → Xem preview → Tạo QR → Xuất & Lấy link.
3) Link public: invitation.html?slug=... (LƯU Ý: bản tĩnh này lưu localStorage, share sang máy khác sẽ không thấy).
4) manager.html → xem/xoá thiệp đã tạo trên thiết bị.

Triển khai thật (đề xuất):
- Next.js + Vercel + MongoDB Atlas → API lưu & đọc thiệp theo slug.
- Upload ảnh: Cloudinary/Supabase Storage.
- Thanh toán: VietQR hiển thị QR; để xác thực tự động cần tích hợp đối soát giao dịch (webhook/đối tác).

Thư mục:
- index.html, admin.html, invitation.html, manager.html, style.css, app.js, README.txt
