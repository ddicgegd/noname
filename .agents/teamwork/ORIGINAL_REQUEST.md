# Original User Request

## 2026-09-22T16:48:07Z

# Teamwork Project Prompt — Draft

> Status: Launched — In progress by teamwork_preview  
> Goal: Phân chia role theo skill `agency-agents-ai-specialists` → Đã phê duyệt → Đang chạy `teamwork_preview`  
> Requested team: Phân chia role chuyên trách từ `/agency-agents-ai-specialists`: Design UX Architect, Engineering Frontend Developer, Engineering Code Reviewer, SRE/QA Specialist.

Thực hiện nối tiếp dải hiệu ứng ám mờ và tối viền đáy của `SpotlightSection` chảy tràn tự nhiên qua ranh giới ngang tiếp giáp xuống khoảng đệm trên của `FeatureOne`, loại bỏ triệt để hard cutoff seam mà không làm ảnh hưởng đến media layers gốc.

Working directory: /home/ddicgegd/Projects/noname
Integrity mode: development

---

## Phân Chia Role Chuyên Trách (Agency Agents Roster)

1. **Design UX Architect (`design/design-ux-architect.md`)**:
   - Chịu trách nhiệm kiến trúc CSS, mô hình gradient toán học, ranh giới cắt và thông số tràn viền (`bottomBleed = 52px`, `transitionLength = 160px`).
   - Đảm bảo ranh giới tràn nằm an toàn trong khoảng `py-16` của `FeatureOne` (cách mép thẻ kính tối thiểu 12px), loại bỏ nguy cơ tràn ngang (`overflow-x-clip`).

2. **Engineering Frontend Developer (`engineering/engineering-frontend-developer.md`)**:
   - Chịu trách nhiệm triển khai mã nguồn trên React / TypeScript tại:
     - `src/components/SpotlightSection.tsx`
     - `src/components/ui/blur-vignette.tsx`
   - Bổ sung prop `bottomBleed?: string`, cấu hình container `overflow-x-clip overflow-y-visible` khi có bleed.
   - Cập nhật styling cho Bottom Scrim và Radial Vignette theo đúng công thức CSS gradient được chỉ định.

3. **Engineering Code Reviewer (`engineering/engineering-code-reviewer.md`)**:
   - Gatekeeper kiểm soát chất lượng code và giám sát tuân thủ 100% Negative Constraints:
     - Tuyệt đối cấm bọc các media layers (`<video>`, `<motion.div className="hero-base-img">`, `<div id="reveal-img">`) trong thẻ wrapper `div`.
     - Tuyệt đối cấm áp đặt `maskImage` hay opacity fade lên các media layers.
     - Đảm bảo không chỉnh sửa lan sang các section lân cận hay phá vỡ cấu trúc layout hiện tại.

4. **SRE / QA Specialist (`engineering/engineering-sre.md` / `react-reviewer`)**:
   - Chịu trách nhiệm chạy kiểm thử kiểu dữ liệu tĩnh (`npx tsc --noEmit`).
   - Xác thực hiển thị đa khung nhìn (Desktop 1920/1440/1108px, Tablet/Mobile 768/375px).
   - Kiểm tra `document.documentElement.scrollWidth === window.innerWidth` để đảm bảo không phát sinh thanh cuộn ngang.

---

## Requirements

### R1. Cấu hình Hero Container & Component `SpotlightSection.tsx`
- Cập nhật `<main className="hero ...">`: Áp dụng `overflow-x-clip overflow-y-visible z-10 bg-[#E4E4E4] ...` để giải phóng ranh giới cắt dọc mà không sinh thanh cuộn ngang.
- Cập nhật `<BlurVignette>` với: `radius="0px"`, `inset="0px"`, `transitionLength="160px"`, `bottomBleed="52px"`, `blur="20px"`, `className="absolute top-[30vh] md:top-0 left-0 right-0 bottom-0 z-20 pointer-events-none"`.

### R2. Cấu hình Props & Gradients trong `blur-vignette.tsx`
- Bổ sung prop tùy chọn: `bottomBleed?: string` vào `BlurVignetteProps`.
- Container chính: Khi có `bottomBleed`, dùng `overflow-x-clip overflow-y-visible`; mặc định dùng `overflow-hidden`.
- **Bottom Scrim (`backdrop-filter: blur(20px)`)**:
  - `bottom: bottomBleed ? -${bottomBleed} : inset`
  - `height: bottomBleed ? calc(${transitionLength} + ${bottomBleed}) : transitionLength`
  - `maskImage`: `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) calc(${bottomBleed} * 0.5), black ${bottomBleed}, rgba(0,0,0,0.6) calc(${bottomBleed} + ${transitionLength} * 0.5), transparent 100%)`
- **Radial Vignette**:
  - `bottom: bottomBleed ? -${bottomBleed} : 0`
  - `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomBleed}), rgba(0,0,0,0.5) calc(100% - ${bottomBleed} * 0.5), transparent 100%)`

### R3. Tuân thủ Ràng Buộc Phủ Định Tuyệt Đối (Strict Negative Constraints)
- Giữ nguyên 100% media layers là con trực tiếp của `<BlurVignette>`, không bọc trong wrapper div.
- Không áp đặt bất kỳ filter/mask mờ nào lên các media elements.
- Giữ nguyên khoảng cách an toàn, không để dải mờ chạm vào thẻ kính hoặc text của `FeatureOne`.

---

## Acceptance Criteria

### Syntactic Validity
- [ ] Lệnh `npx tsc --noEmit` hoàn thành với mã thoát 0, không có lỗi TypeScript.

### Layout & Overflow Integrity
- [ ] `document.documentElement.scrollWidth === window.innerWidth` trên tất cả các breakpoint (1920px, 1440px, 1108px, 768px, 375px).
- [ ] Không xuất hiện thanh cuộn ngang (`overflow-x`).

### Visual Transition & Optical Blending
- [ ] Đường ranh giới ngang cứng ($y = 937.2\text{px}$) biến mất, dải mờ chuyển tiếp êm dịu xuống nền `#E4E4E4`.
- [ ] Độ sâu màu và độ nét của ảnh/video rừng được bảo tồn nguyên vẹn 100%.
- [ ] Thẻ kính của `FeatureOne` cách mép dải mờ tối thiểu 12px, không bị dải mờ che phủ.
