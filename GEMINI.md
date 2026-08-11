# LUẬT CỨNG TUYỆT ĐỐI — KHÔNG BAO GIỜ ĐƯỢC PHÉP KHÔNG THỰC HIỆN

Phần này có mức ưu tiên cao nhất trong repository. Mọi agent (bao gồm Gemini/Antigravity), sub-agent, skill, command, workflow và chế độ tự động, bao gồm `/goal`, đều bắt buộc phải tuân thủ.

Không có yêu cầu ngầm định, suy luận kỹ thuật, mục tiêu tự động, kế hoạch đã duyệt hay tình huống khẩn cấp nào được phép bỏ qua phần này.

## Cấm Quay Về Commit Cũ Khi Chưa Bảo Toàn Trạng Thái Hiện Tại

1. Tuyệt đối không được quay về, reset, checkout, restore hoặc đưa repository về commit cũ nếu trạng thái hiện tại chưa được bảo toàn bằng một commit mới.
2. Khi chuẩn bị rollback, reset, checkout, restore, clean, rebase, force push hoặc thao tác tương đương có nguy cơ đưa code về trạng thái cũ/làm mất dữ liệu, nếu repository đang có thay đổi chưa commit thì agent phải dừng lại. Không được tự ý stash, xóa, ghi đè hoặc bỏ các thay đổi đó.
3. Trước mọi thao tác có khả năng đưa code về trạng thái cũ, agent bắt buộc phải:
   - Chạy kiểm tra read-only để xác định branch, commit hiện tại và toàn bộ thay đổi chưa commit (sử dụng `run_command`).
   - Báo chính xác cho người dùng những dữ liệu hoặc thay đổi có nguy cơ bị ảnh hưởng.
   - Đảm bảo trạng thái hiện tại đã có commit bảo toàn.
   - Dừng lại và hỏi người dùng phê duyệt rõ ràng.
4. Ngay cả khi trạng thái hiện tại đã được commit hoặc backup, agent vẫn không được tự động quay về commit cũ. Agent phải dừng và nhận được sự đồng ý rõ ràng của người dùng trước khi chạy lệnh.
5. Quy định này áp dụng tuyệt đối, kể cả khi:
   - Đang chạy `/goal`.
   - Đang thực hiện plan đã được duyệt.
   - Agent cho rằng rollback là cách sửa lỗi nhanh nhất.
   - Build, test, merge hoặc deployment bị lỗi.
   - Người dùng trước đó từng nói chung chung rằng hãy “sửa”, “khôi phục” hoặc “làm cho chạy lại”.
6. Chỉ một yêu cầu rõ ràng, trực tiếp của người dùng về đúng commit và đúng thao tác hiện tại mới được xem là phê duyệt. Sự im lặng hoặc yêu cầu cũ không phải là phê duyệt.

## Cấm Chạy Lệnh Git Nguy Hiểm Khi Chưa Có Backup Và Phê Duyệt

1. Tuyệt đối không được chạy bất kỳ lệnh Git nào có khả năng làm mất, ghi đè, che khuất hoặc thay đổi khó phục hồi dữ liệu nếu chưa có backup có thể kiểm chứng.
2. Sau khi tạo backup, agent vẫn phải dừng lại, trình bày:
   - Lệnh dự định chạy.
   - Branch, commit, file hoặc phạm vi bị tác động.
   - Rủi ro cụ thể.
   - Vị trí và cách phục hồi từ backup.
3. Chỉ được chạy lệnh sau khi người dùng phê duyệt rõ ràng cho đúng lệnh và đúng phạm vi đó.
4. Các lệnh và hành vi nguy hiểm bao gồm nhưng không giới hạn:
   - `git reset`, đặc biệt `git reset --hard`.
   - `git checkout -- <file>` hoặc checkout sang commit cũ.
   - `git restore`, đặc biệt `git restore --source`, `--staged` hoặc `--worktree`.
   - `git clean`, đặc biệt `git clean -f`, `-fd`, `-fdx`.
   - `git switch --discard-changes`.
   - `git stash drop`, `git stash clear`, `git stash pop` khi có nguy cơ conflict hoặc mất dữ liệu.
   - `git rebase`, `git rebase --onto`, `git rebase --abort`.
   - `git cherry-pick`, `git cherry-pick --abort`.
   - `git merge --abort` khi trạng thái hiện tại chưa được bảo toàn.
   - `git commit --amend`.
   - `git branch -D`.
   - `git tag -d`.
   - `git push --force` hoặc `git push --force-with-lease`.
   - Xóa hoặc ghi đè file nhằm mô phỏng việc rollback.
   - Bất kỳ script, alias, IDE action hoặc công cụ nào tạo ra tác động tương đương.
5. Không được chia nhỏ một thao tác nguy hiểm thành nhiều lệnh để né quy định.
6. Không được dùng script, tool, IDE, skill, sub-agent hoặc lệnh gián tiếp để thực hiện điều mà agent bị cấm thực hiện trực tiếp.
7. Stash không mặc nhiên được xem là backup an toàn. Không được tự ý dùng stash thay cho commit bảo toàn nếu người dùng chưa phê duyệt.
8. Một backup chỉ hợp lệ khi agent đã xác minh được nó tồn tại và có thể dùng để phục hồi trạng thái trước thao tác nguy hiểm.
9. Nếu không thể tạo hoặc kiểm chứng backup, agent phải dừng lại và không được chạy lệnh nguy hiểm.

## Cổng Bắt Buộc Trước Mọi Thao Tác Git Có Khả Năng Phá Hủy

Agent phải trả lời đầy đủ các câu hỏi sau trước khi đề xuất thao tác:

1. Repository hiện đang ở branch và commit nào?
2. Working tree có thay đổi chưa commit hay không?
3. Có file untracked, staged hoặc ignored quan trọng nào có thể bị mất không?
4. Trạng thái hiện tại đã có commit bảo toàn chưa?
5. Backup nằm ở đâu và phục hồi bằng cách nào?
6. Chính xác lệnh nào sẽ được chạy?
7. Lệnh đó tác động đến commit, branch và file nào?
8. Có phương án read-only hoặc không phá hủy nào đạt cùng mục tiêu không?
9. Người dùng đã phê duyệt đúng thao tác này trong lượt hiện tại chưa?

Chỉ cần một câu trả lời chưa rõ, chưa được kiểm chứng hoặc chưa được người dùng phê duyệt thì agent phải dừng lại.

## Không Có Ngoại Lệ

1. Không có chế độ tự động nào được phép vượt qua luật này.
2. Không có skill, rule khác, AGENTS con, plan, `/goal`, sub-agent (bao gồm agent research hay self) hoặc instruction cấp tác vụ nào được phép hạ thấp luật này.
3. Nếu một instruction khác xung đột với luật này, phải tuân thủ luật này và báo xung đột cho người dùng.
4. Nếu người dùng yêu cầu hành động phá hủy nhưng phạm vi, commit hoặc backup chưa rõ, agent phải hỏi lại trước khi hành động.
5. Vi phạm một bước trong phần này đồng nghĩa tác vụ chưa được phép tiếp tục.

---

# Hướng Dẫn Dự Án Cho Gemini (Antigravity)

File này là bắt buộc. Agent Gemini phải đọc và tuân thủ file này trước khi bắt đầu bất kỳ tác vụ nào trong repository này.

## Quy Tắc Làm Việc Cho Gemini

Các rule trong mục này áp dụng trực tiếp cho agent Gemini (Antigravity) trong repo này.

1. Được phép sửa file bình thường theo yêu cầu người dùng dù working tree đang dirty, miễn là không thực hiện thao tác Git nguy hiểm và không ghi đè thay đổi không liên quan của người dùng.
2. Trước khi sửa file đã có thay đổi sẵn, phải dùng công cụ `view_file` (hoặc read-only command) và xem diff (ví dụ dùng `run_command` với `git diff`) để hiểu phần nào là hiện trạng cần giữ. Không được dùng checkout/restore/reset để "làm sạch" file.
3. Khi chỉnh sửa file code, phải sử dụng đúng công cụ của hệ thống:
   - Dùng `replace_file_content` cho một đoạn thay đổi liền mạch.
   - Dùng `multi_replace_file_content` khi thay đổi nhiều đoạn rời rạc trong cùng một file.
   - Không được dùng các lệnh shell như `sed`, `cat`, hay `echo` để ghi/sửa file trừ khi cực kỳ cần thiết và an toàn.
   - Tuyệt đối không thay thế lại toàn bộ nội dung file (overwrite toàn bộ) bằng `write_to_file` nếu chỉ cần sửa một số dòng nhỏ, việc này rất tốn kém và dễ gây lỗi.
4. Khi tìm kiếm nội dung trong project, ưu tiên dùng công cụ `grep_search`.
5. Khi kiểm tra trạng thái Git, chỉ dùng lệnh read-only qua công cụ `run_command` như `git status`, `git diff`, `git log`, `git show`. Các lệnh Git trong danh sách nguy hiểm ở trên chỉ được chạy sau khi qua đủ cổng phê duyệt.
6. Không dùng sub-agent (research, self), skill, hay bất kỳ công cụ ẩn nào để né các quy định trong `GEMINI.md`.
7. Nếu yêu cầu người dùng là sửa rule hoặc sửa chính `GEMINI.md`, phải giữ nguyên các phần rule hiện có trừ khi người dùng yêu cầu rõ ràng xóa/thay thế phần đó.

## Quy Trình Nạp Rule

Trước khi làm bất kỳ tác vụ nào:

1. Phân loại yêu cầu của người dùng.
2. Nạp mọi phần rule trong file này có trigger khớp với yêu cầu. Nếu phần rule khớp yêu cầu đọc thêm file rule khác, phải đọc toàn bộ file đó bằng `view_file` trước khi hành động.
3. Kiểm tra `.agents/skills/` (bằng `list_dir`) và xác định mọi skill local có trigger khớp với yêu cầu. Nếu có skill khớp, phải nạp skill theo `Quy Trình Nạp Skill Local Bắt Buộc` bên dưới trước khi hành động.
4. Nếu yêu cầu nghiệp vụ, hành vi mong muốn hoặc ý đồ giao diện còn thiếu hoặc mơ hồ, phải dừng ngay và hỏi người dùng làm rõ qua chat trước khi viết code.
5. Không được sửa file cho đến khi yêu cầu đã rõ và mọi rule/skill liên quan đã được nạp.
6. Trước mọi thao tác Git có khả năng thay đổi hoặc làm mất trạng thái hiện tại, phải áp dụng `LUẬT CỨNG TUYỆT ĐỐI` ở đầu file.

## Quy Trình Nạp Skill Local Bắt Buộc

Các skill trong `.agents/skills/` là luật bắt buộc của repository, không phải tài liệu tham khảo tùy chọn. Agent Gemini, các sub-agent được tạo ra, lệnh shell tự động, và chế độ `/goal` đều phải tuân thủ.

1. Trước khi hành động, phải kiểm tra các skill local liên quan trong `.agents/skills/`.
2. Khi yêu cầu khớp với `description`, tên skill, trigger trong skill, hoặc lĩnh vực mà skill quản lý, phải đọc toàn bộ file `.agents/skills/<skill>/SKILL.md` (bằng `view_file`) từ chính repository này. Với repo hiện tại, skill shadcn nằm ở `.agents/skills/shadcn/SKILL.md`.
3. Nếu `SKILL.md` trỏ tới file rule/tài liệu khác bằng đường dẫn tương đối, phải dùng `view_file` đọc toàn bộ các file liên quan đó trước khi sửa code hoặc chạy lệnh có tác động.
4. Phải áp dụng cả `SKILL.md` và các file rule đã được trỏ tới. Không được chỉ đọc rồi bỏ qua.
5. Nếu skill có workflow dùng CLI/tool cụ thể, phải dùng `run_command` để chạy đúng CLI/tool đó và đúng runner/package manager được skill yêu cầu. Không được thay bằng package, command hoặc API deprecated.
6. Nếu skill yêu cầu preview, dry-run, docs, info, audit hoặc verification trước khi ghi file/overwrite/update component, phải thực hiện đủ thông qua `run_command`. Không được tự đoán API hiện tại.
7. Nếu skill yêu cầu hỏi người dùng khi registry, preset, overwrite mode, product direction hoặc phạm vi chưa rõ, phải dừng và hỏi trực tiếp thông qua chat. Không được tự mặc định.
8. Nếu skill xung đột với `LUẬT CỨNG TUYỆT ĐỐI`, phải tuân thủ `LUẬT CỨNG TUYỆT ĐỐI` và báo xung đột. Nếu skill xung đột với rule dự án cấp thấp hơn, skill local được ưu tiên cho phạm vi mà nó quản lý.
9. Nếu skill local xung đột với skill cùng tên ở nơi khác (ví dụ built-in skills của Antigravity), phải dùng skill local trong repo này trước.
10. Nếu công cụ/tài nguyên mà skill cần bị thiếu, không đọc được, hoặc đường dẫn bị hỏng, phải báo rõ và không được giả vờ đã nạp skill.

## Bộ Điều Phối Rule

| Trigger | Rule bắt buộc |
| --- | --- |
| Git rollback, reset, restore, checkout commit cũ, clean, rebase, force push hoặc thao tác có nguy cơ mất dữ liệu | `LUẬT CỨNG TUYỆT ĐỐI` ở đầu file |
| UI, giao diện, layout, styling, responsive, animation, component, page, form, table, modal, navigation, design system | `Rule Giao Diện` trong file này và skill `.agents/skills/shadcn` |
| shadcn, Base UI, Radix, registry component, component install/update, preset, `components.json`, theme token, alias UI, icon library, chat UI | `Rule Giao Diện` trong file này và skill `.agents/skills/shadcn` |
| Yêu cầu không khớp rule chuyên biệt nào | Tuân thủ hướng dẫn chung trong file này |

## Skill shadcn Local Bắt Buộc

Project này có skill shadcn tại `.agents/skills/shadcn`. Mọi tác vụ chạm tới shadcn/ui, Base UI, Radix, registry, preset, component UI, form UI, styling, icon, chat/messaging UI, `components.json`, `src/index.css`, alias component hoặc theme token đều bắt buộc phải nạp và tuân thủ skill này.

### Thông Số shadcn Bắt Buộc Của Repo Này

Gemini không được tự chọn framework, runner, primitive, alias, icon library hoặc theme khác. Các giá trị đúng của repo này là:

| Hạng mục | Bắt buộc dùng |
| --- | --- |
| Package runner | `npx` (chạy qua `run_command`) |
| shadcn CLI | `npx shadcn@latest ...` |
| Không được dùng | `shadcn-ui`, `pnpm dlx shadcn@latest`, `bunx --bun shadcn@latest`, raw GitHub fetch thay CLI |
| Framework | Vite React |
| TypeScript | Có |
| RSC | Không. Không thêm `"use client"` theo thói quen Next.js |
| Tailwind | v4 |
| Global CSS/theme file | `src/index.css` |
| shadcn style/preset | `base-nova`, preset code hiện tại `b2fA` |
| Primitive base | `base` / Base UI |
| Component API khi thay trigger/custom element | Dùng `render`, không dùng `asChild` |
| Base UI non-button render | Nếu `render` ra `<a>`, `<span>` hoặc element không phải button, thêm `nativeButton={false}` khi component yêu cầu |
| Icon library | `lucide` qua package `lucide-react` |
| UI import alias | `@/components/ui` |
| Components alias | `@/components` |
| Utils alias | `@/lib/utils` |
| Hooks alias | `@/hooks` |
| UI source path | `src/components/ui` |
| shadcn registry mặc định | `@shadcn` |

Mỗi khi tác vụ chạm shadcn/config/component/theme/alias, agent vẫn phải chạy lại `npx shadcn@latest info --json` (bằng `run_command`) để xác minh trạng thái hiện tại. Nếu output khác bảng trên, agent phải dừng, báo khác biệt cụ thể và hỏi người dùng trước khi tiếp tục.

Các component shadcn hiện đã cài theo lần xác minh gần nhất:
`badge`, `button`, `card`, `checkbox`, `command`, `dialog`, `input-group`, `input`, `label`, `popover`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `slider`, `switch`, `tabs`, `textarea`, `tooltip`.

Gemini không được import component ngoài danh sách này nếu chưa kiểm tra lại bằng `npx shadcn@latest info --json` hoặc chưa add component bằng đúng CLI shadcn.

Trước khi hành động trong phạm vi trên, Gemini phải đọc toàn bộ (sử dụng `view_file`):

1. `.agents/skills/shadcn/SKILL.md`
2. `.agents/skills/shadcn/rules/styling.md`
3. `.agents/skills/shadcn/rules/forms.md`
4. `.agents/skills/shadcn/rules/composition.md`
5. `.agents/skills/shadcn/rules/base-vs-radix.md`
6. `.agents/skills/shadcn/rules/icons.md`
7. `.agents/skills/shadcn/rules/chat.md` nếu có chat, messaging, attachment, streaming hoặc conversation UI
8. `.agents/skills/shadcn/cli.md` nếu chạy hoặc đề xuất shadcn CLI
9. `.agents/skills/shadcn/customization.md` nếu chạm theme, CSS variable, dark mode, radius, custom color hoặc global CSS
10. `.agents/skills/shadcn/registry.md` nếu chạm registry, registry item, block bên thứ ba hoặc GitHub registry
11. `.agents/skills/shadcn/mcp.md` nếu dùng MCP/registry tooling liên quan shadcn

Các yêu cầu cứng từ skill shadcn cho Gemini:

1. Chạy đúng `npx shadcn@latest info --json` khi tác vụ chạm tới cấu hình shadcn, API component, theme token, alias, base, icon library hoặc component đã cài. Không thay bằng công cụ khác hay tự đoán.
2. Không dùng package deprecated `shadcn-ui`.
3. Không import UI component chưa tồn tại trong `src/components/ui`.
4. Khi tạo, sửa, debug hoặc compose component shadcn, phải chạy đúng `npx shadcn@latest docs <component>` và lấy nội dung docs/example/API liên quan trước khi đoán API.
5. Khi add/update component, phải dùng `npx shadcn@latest add` với `--dry-run`, `--diff` hoặc `--view` khi cần preview. Không fetch raw file từ GitHub.
6. Không dùng `--overwrite`, `apply`, `init --force`, preset switch hoặc thao tác có thể ghi đè nếu chưa có phê duyệt rõ ràng.
7. Registry mặc định đã cấu hình là `@shadcn`. Nếu người dùng nêu rõ registry khác thì dùng đúng registry đó. Nếu dùng block bên thứ ba phải hỏi người dùng.
8. Repo này dùng Base UI (`base: "base"`). Khi compose trigger/custom element phải dùng `render`, không dùng `asChild`.
9. Form phải dùng `FieldGroup`, `Field`, `FieldSet`, v.v... theo đúng chuẩn, không tự dựng layout form bằng `div` tùy tiện.
10. Icon phải import từ `lucide-react`. Với Button, icon dùng `data-icon="inline-start"` hoặc `data-icon="inline-end"`.
11. Chat/conversation UI phải dùng các primitive được cung cấp khi có sẵn.

## Rule Giao Diện

Rule này áp dụng cho mọi thay đổi giao diện, dù nhỏ. Một tác vụ được xem là tác vụ giao diện nếu nó thay đổi JSX/TSX markup, cách ghép component, `className`, CSS global, theme token, icon, layout, animation, responsive behavior, thuộc tính accessibility hoặc bất kỳ trạng thái nào người dùng nhìn thấy trên màn hình.

### Quy Trình Bắt Buộc

1. Trước khi sửa, phải dùng `view_file` kiểm tra màn hình/component hiện tại, các component lân cận, `components.json`, `src/index.css` và pattern import/component đang dùng.
2. Vì project này dùng shadcn Base UI với style/preset `base-nova`, phải chạy `npx shadcn@latest info --json` khi tác vụ chạm tới cấu hình, theme, alias hoặc UI component đã cài.
3. Không bao giờ dùng package deprecated `shadcn-ui`. Chỉ dùng `npx shadcn@latest ...`.
4. Trước khi thêm hoặc dùng shadcn component, phải kiểm tra component đó đã tồn tại dưới UI path hay chưa bằng `list_dir` hoặc tìm kiếm file.
5. Khi thêm, cập nhật hoặc compose shadcn component, phải dùng `npx shadcn@latest docs <component>` và bám theo docs/API hiện tại thay vì đoán.
6. Không được overwrite các file cấu hình hoặc component được generate nếu chưa có phê duyệt.
7. Nếu kết quả giao diện người dùng muốn chưa rõ, phải dừng và hỏi bằng chat. Không được tự bịa product direction.

### Yêu Cầu Composition

1. Ưu tiên shadcn/Base UI component hiện có và component tái sử dụng local thay vì custom styled markup.
2. Phải compose primitive đúng cấu trúc bắt buộc: trigger nằm trong parent tương ứng, item nằm trong group, dialog/sheet/drawer có title accessible, card có header/content/footer đúng vai trò, avatar có fallback.
3. Dùng alias của project từ `components.json`; không hardcode convention alias khác.
4. Dùng icon từ `lucide-react` cho project này. Không đổi icon library, không tự migration `components.json`.
5. Button, tool action, toggle, menu, tab, form, table, empty state, loading state, alert, dialog, sheet, popover và navigation phải dùng component pattern tương ứng thay vì thay bằng `div`/`span` tùy tiện.
6. Form phải có label, description/error khi cần, trạng thái `aria-*` hợp lệ, hỗ trợ bàn phím và focus state rõ ràng.
7. UI tương tác phải có disabled/loading/empty/error/success state thật khi các trạng thái đó có thể xảy ra.

### Yêu Cầu Styling

1. Dùng semantic token và theme variable hiện có cho color, border, background, ring và text. Raw color chỉ được dùng khi chủ động mở rộng theme trong `src/index.css`.
2. Dùng Tailwind utility class cho layout và spacing, nhưng không được chống lại internal style của component bằng override tùy tiện.
3. Dùng `gap-*` để tạo khoảng cách giữa các phần tử con. Không thêm `space-x-*` hoặc `space-y-*` mới.
4. Dùng `size-*` khi width và height bằng nhau.
5. Dùng `cn()` cho conditional class composition.
6. Không thêm manual dark-mode color override nếu semantic token đã biểu đạt được hành vi đó.
7. Không tạo visual system một lần dùng riêng bên trong một feature. UI mới phải khớp theme, radius, typography, spacing scale và interaction style hiện có.
8. Text không được overflow, overlap, bị clip ngoài ý muốn hoặc khó đọc ở mobile, tablet hay desktop.
9. Không che giấu lỗi layout bằng fixed height tùy tiện, absolute positioning, negative margin hoặc z-index, trừ khi hành vi component thật sự cần.

### Chuẩn Chất Lượng Giao Diện

1. First viewport phải truyền đạt được product/workflow thật, không phải placeholder hoặc vỏ trang trí.
2. UI phải dùng được trực tiếp. Không được thay một app/tool/workflow bằng landing page kiểu marketing nếu người dùng không yêu cầu landing page.
3. Các phần tử lặp lại phải align nhất quán, có kích thước ổn định và không shift khi content thay đổi hoặc khi hover/focus state xuất hiện.
4. Control phải nhìn và hoạt động như control. Icon button cần accessible name/tooltip khi icon không tự giải thích đủ rõ.
5. Responsive behavior là bắt buộc. Implementation phải hoạt động ở viewport mobile hẹp và desktop thông thường.
6. Accessibility là một phần của tiêu chí hoàn thành: semantic element, keyboard navigation, focus visibility, contrast, label và screen-reader name phải được xử lý.

### Cổng Verification

Trước khi báo hoàn thành bất kỳ thay đổi giao diện nào, Gemini phải:

1. Chạy static check liên quan, thường là `npm run lint` (thông qua `run_command`).
2. Chạy `npm run build`, trừ khi thay đổi chỉ là documentation hoặc người dùng yêu cầu rõ là không chạy.
3. Start hoặc dùng local app và yêu cầu người dùng kiểm tra UI trong browser khi thay đổi có tính visual.
4. Sửa mọi regression nhìn thấy được trước khi trả lời cuối.
5. Nếu không chạy được bước verification nào, phải nói rõ bước nào bị bỏ qua và lý do.

### Tiêu Chí Hoàn Thành

Một tác vụ giao diện chưa được xem là xong cho đến khi code compile được, màn hình đã thay đổi được inspect trực quan, responsive behavior được kiểm tra, accessibility cơ bản đạt yêu cầu và câu trả lời cuối nêu rõ các bước check đã thực hiện.