# -*- coding: utf-8 -*-
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = docx.Document()

    # 1. Page Margins (Normal 1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = False
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("DoanhNghiepVN.today — Tài liệu Tổng quan Tính năng Hệ thống")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(148, 163, 184) # Slate 400

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Tạp chí Doanh Nghiệp Việt Nam • Đơn vị phát triển: Công ty Cổ phần ADT Quốc tế")
        frun.font.name = "Arial"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # Helper styling functions
    def set_cell_background(cell, fill_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_callout(text, title=None, fill_hex="F0FDFA", border_hex="0D9488"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, fill_hex)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        
        # Border left only
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>')
        cell._tc.get_or_add_tcPr().append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        if title:
            r_title = p.add_run(f"{title}\n")
            r_title.font.name = "Arial"
            r_title.font.size = Pt(10.5)
            r_title.font.bold = True
            r_title.font.color.rgb = RGBColor(13, 148, 136)
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = RGBColor(51, 65, 85)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_heading_1(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.font.name = "Arial"
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(13, 148, 136) # Teal 600
        return p

    def add_heading_2(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.font.name = "Arial"
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
        return p

    def add_heading_3(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.font.name = "Arial"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_p(text, bold_prefix=None, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Arial"
            r_bold.font.size = Pt(10)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(15, 23, 42)
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(10)
        r_text.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Arial"
            r_bold.font.size = Pt(10)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(15, 23, 42)
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(10)
        r_text.font.color.rgb = RGBColor(51, 65, 85)
        return p

    # ==========================================
    # COVER / HEADER TITLE
    # ==========================================
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(10)
    p_pre.paragraph_format.space_after = Pt(2)
    r_org = p_pre.add_run("TẠP CHÍ DOANH NGHIỆP VIỆT NAM • CÔNG TY CỔ PHẦN ADT QUỐC TẾ")
    r_org.font.name = "Arial"
    r_org.font.size = Pt(9.5)
    r_org.font.bold = True
    r_org.font.color.rgb = RGBColor(13, 148, 136)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(4)
    r_main_title = p_title.add_run("TÀI LIỆU MÔ TẢ TỔNG QUAN TÍNH NĂNG VÀ KIẾN TRÚC HỆ THỐNG")
    r_main_title.font.name = "Arial"
    r_main_title.font.size = Pt(18)
    r_main_title.font.bold = True
    r_main_title.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_sub = p_sub.add_run("Nền tảng số DoanhNghiepVN.today — Cổng kết nối giao thương, tư vấn doanh nghiệp & ứng dụng Trí tuệ Nhân tạo AI")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(100, 116, 139)

    add_callout(
        "Tài liệu này hệ thống hóa toàn bộ các phân hệ tính năng, luồng nghiệp vụ người dùng, cơ chế quản trị và hạ tầng công nghệ của nền tảng DoanhNghiepVN.today (phiên bản Release v2.0 - 2026). Phục vụ công tác bàn giao, hướng dẫn vận hành, đào tạo người dùng và kiểm thử nghiệm thu.",
        title="THÔNG ĐIỆP BÀN GIAO & VẬN HÀNH DỰ ÁN"
    )

    # ==========================================
    # PHẦN 1: GIỚI THIỆU TỔNG QUAN HỆ THỐNG
    # ==========================================
    add_heading_1("1. TỔNG QUAN DỰ ÁN VÀ ĐỊNH VỊ NỀN TẢNG")
    add_p(
        "DoanhNghiepVN.today là nền tảng số hóa đa chức năng thuộc bản quyền của Tạp chí Doanh Nghiệp Việt Nam, do Công ty Cổ phần ADT Quốc tế nghiên cứu và phát triển theo Hợp đồng số 204-100126/ADT-DNVN. Nền tảng được xây dựng với mục tiêu trở thành trung tâm kết nối toàn diện cho cộng đồng doanh nghiệp Việt Nam trong thời kỳ cách mạng công nghệ và chuyển đổi xanh.",
        bold_prefix="Định vị chiến lược: "
    )
    add_bullet("Hệ thống số hóa truyền thông và báo chí chuyên nghiệp dành riêng cho giới doanh nhân, nhà quản trị và các hiệp hội ngành nghề.", "Kênh truyền thông chính thống: ");
    add_bullet("Cung cấp các chương trình tư vấn chiến lược trong 6 lĩnh vực cốt lõi: Vay vốn & Tín dụng, Truyền thông & Thương hiệu, Marketing & Bán hàng B2B, Ứng dụng AI & Chuyển đổi số ERP, Thực hành ESG & Chuyển đổi xanh, Kết nối giao thương B2B.", "Cổng dịch vụ doanh nghiệp: ");
    add_bullet("Hỗ trợ đăng ký trực tuyến, quản lý dung lượng vé, thanh toán tự động qua VietQR, tải và duyệt chứng từ thanh toán, xuất vé kèm mã QR định danh và hệ thống kiểm soát check-in bằng camera thời gian thực.", "Nền tảng tổ chức sự kiện & phát hành vé QR: ");
    add_bullet("Mỗi doanh nghiệp hội viên được cấp một trang giới thiệu năng lực số (Digital Showroom/Profile) giúp quảng bá thương hiệu, năng lực cung ứng và tìm kiếm cơ hội hợp tác kinh doanh.", "Danh bạ & Hồ sơ doanh nghiệp số: ");
    add_bullet("Ứng dụng mô hình ngôn ngữ lớn (Google Gemini AI) đóng vai trò trợ lý pháp lý, chính sách, thuế và quản trị doanh nghiệp phục vụ 24/7.", "Trợ lý Trí tuệ Nhân tạo (AI Agent): ");
    add_bullet("Hỗ trợ cài đặt trực tiếp lên điện thoại (iOS / Android) và máy tính mà không cần qua App Store/Google Play, chạy toàn màn hình và hoạt động mượt mà.", "Ứng dụng Web cấp tiến (PWA): ");

    # Bảng thông tin dự án
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    tbl_meta = doc.add_table(rows=6, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_meta.autofit = False
    
    meta_data = [
        ("Tên nền tảng", "DoanhNghiepVN.today (Tạp chí Doanh Nghiệp Việt Nam)"),
        ("Tên miền chính thức", "https://doanhnghiepvn.today/"),
        ("Đơn vị sở hữu nội dung", "Tạp chí Doanh Nghiệp Việt Nam"),
        ("Đơn vị phát triển công nghệ", "Công ty Cổ phần ADT Quốc tế"),
        ("Ngân hàng tích hợp VietQR", "Techcombank — Số TK: 19036730021017 (CONG TY CO PHAN ADT QUOC TE)"),
        ("Phiên bản hệ thống", "Release 2.0.0 (Cập nhật Tháng 10/2026)")
    ]

    for row_idx, (col1, col2) in enumerate(meta_data):
        row = tbl_meta.rows[row_idx]
        cell_lbl = row.cells[0]
        cell_val = row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.3)
        set_cell_background(cell_lbl, "F8FAFC")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)
        
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:right w:val="none"/></w:tcBorders>')
        cell_lbl._tc.get_or_add_tcPr().append(borders)
        borders2 = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:right w:val="none"/></w:tcBorders>')
        cell_val._tc.get_or_add_tcPr().append(borders2)

        p1 = cell_lbl.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(col1)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)

        p2 = cell_val.paragraphs[0]
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(col2)
        r2.font.name = "Arial"
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ==========================================
    # PHẦN 2: KIẾN TRÚC PHÂN QUYỀN RBAC
    # ==========================================
    add_heading_1("2. KIẾN TRÚC NGƯỜI DÙNG & HỆ THỐNG PHÂN QUYỀN (RBAC)")
    add_p("Hệ thống áp dụng mô hình phân quyền chặt chẽ theo vai trò (Role-Based Access Control) với 6 nhóm đối tượng người dùng độc lập, đảm bảo tính bảo mật và chuyên môn hóa trong vận hành:")

    roles = [
        ("1. Khách vãng lai (Public User)", "Người dùng đại chúng, doanh nghiệp bên ngoài truy cập website. Có thể đọc tin tức, tra cứu danh bạ doanh nghiệp, đăng ký nhu cầu tư vấn (Lead), tra cứu sự kiện và đăng ký mua vé tham dự."),
        ("2. Doanh nghiệp Hội viên (Member)", "Các doanh nghiệp đã đăng ký tài khoản và được Ban Biên tập phê duyệt. Phân thành 3 hạng: Silver, Gold, Platinum. Được cấp trang Showroom hồ sơ doanh nghiệp số, quyền đăng bài viết giới thiệu sản phẩm, gửi yêu cầu ghim bài nổi bật, quản lý vé sự kiện cá nhân."),
        ("3. Biên tập viên / Tòa soạn (Content Creator)", "Phóng viên, cộng tác viên chuyên trách sản xuất nội dung bài viết. Có cổng làm việc riêng (`/creator-login`), viết bài theo 7 chuyên mục, theo dõi thống kê lượt xem bài viết của mình."),
        ("4. Ban tổ chức Sự kiện (Event Organizer)", "Tài khoản chuyên trách quản lý sự kiện do Admin cấp quyền tại cổng (`/organizer-login`). Có toàn quyền tạo mới sự kiện, cập nhật địa điểm, giá vé, xem danh sách đăng ký, xem ảnh bill chuyển khoản và duyệt trạng thái Đã thanh toán, kiểm soát check-in."),
        ("5. Nhân viên Soát vé (Ticket Inspector)", "Vai trò mới được tích hợp chung tại cổng Ban tổ chức, chuyên trách tại cửa đón tiếp sự kiện. Chỉ được phép theo dõi thông tin sự kiện và thực hiện quét mã QR / check-in vé. Bị ẩn và chặn nghiêm ngặt quyền tạo, chỉnh sửa hay xóa sự kiện."),
        ("6. Quản trị viên tối cao (Super Admin)", "Ban Biên tập và Quản trị viên kỹ thuật cao nhất. Quản lý toàn bộ hội viên, bài viết, sự kiện, doanh thu, leads tư vấn, tài khoản biên tập viên, ban tổ chức và cấu hình hệ sinh thái.")
    ]

    for role_name, role_desc in roles:
        add_bullet(role_desc, f"{role_name}: ")

    # Bảng ma trận phân quyền
    add_heading_2("Bảng ma trận chức năng và quyền hạn chi tiết")
    tbl_matrix = doc.add_table(rows=8, cols=7)
    tbl_matrix.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_matrix.autofit = False

    matrix_headers = ["Nhóm Chức Năng", "Khách", "Hội viên", "BTV", "Soát vé", "BTC", "Admin"]
    matrix_rows = [
        ("Xem tin tức, sự kiện công khai", "✔", "✔", "✔", "✔", "✔", "✔"),
        ("Đăng ký vé (Miễn phí & Có phí)", "✔", "✔", "✔", "✔", "✔", "✔"),
        ("Showroom DN & Đăng bài hội viên", "—", "✔", "—", "—", "—", "✔"),
        ("Viết bài & Biên tập phóng sự", "—", "—", "✔", "—", "—", "✔"),
        ("Soát vé & Quét mã QR Check-in", "—", "—", "—", "✔", "✔", "✔"),
        ("Tạo & Chỉnh sửa thông tin Sự kiện", "—", "—", "—", "—", "✔", "✔"),
        ("Xem bill & Duyệt tiền vé sự kiện", "—", "—", "—", "—", "✔", "✔"),
    ]

    for col_idx, h in enumerate(matrix_headers):
        c = tbl_matrix.rows[0].cells[col_idx]
        set_cell_background(c, "0D9488")
        set_cell_margins(c, top=100, bottom=100, left=60, right=60)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    for row_idx, r_data in enumerate(matrix_rows):
        row = tbl_matrix.rows[row_idx + 1]
        for col_idx, val in enumerate(r_data):
            c = row.cells[col_idx]
            bg = "FFFFFF" if row_idx % 2 == 0 else "F8FAFC"
            set_cell_background(c, bg)
            set_cell_margins(c, top=70, bottom=70, left=60, right=60)
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            if val == "✔":
                r.font.bold = True
                r.font.color.rgb = RGBColor(13, 148, 136)
            elif val == "—":
                r.font.color.rgb = RGBColor(148, 163, 184)
            else:
                r.font.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ==========================================
    # PHẦN 3: CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG
    # ==========================================
    add_heading_1("3. MÔ TẢ CHI TIẾT CÁC PHÂN HỆ TÍNH NĂNG CHÍNH")

    # 3.1 Public Portal
    add_heading_2("3.1. Phân hệ Cổng Thông Tin & Trang Chủ (Public Portal)")
    add_bullet("Trình bày nhận diện thương hiệu chuẩn Tạp chí Doanh Nghiệp Việt Nam với tông màu xanh ngọc lục bảo (Teal #0D9488) kết hợp Slate cao cấp, logo chính thức, slogan và thanh tìm kiếm đa năng tích hợp AI.", "Giao diện Hero Section & Nhận diện: ");
    add_bullet("Hiển thị 6 trụ cột tư vấn chiến lược với hệ thống ô vuông màu gradient sống động kèm biểu tượng Tabler Icons chuẩn hóa:", "Khối 6 Trụ cột Tư vấn Doanh nghiệp: ");
    add_p("    • Tư vấn Vốn & Tín dụng (Icon Ngân hàng - Màu Ngọc lục bảo Teal #0D9488)\n    • Truyền thông & Thương hiệu (Icon Loa phát thanh - Màu Xanh biển #0284C7)\n    • Marketing & Bán hàng (Icon Biểu đồ tăng trưởng - Màu Đỏ san hô #E11D48)\n    • Ứng dụng AI & Chuyển đổi số (Icon Vi xử lý AI - Màu Tím công nghệ #7C3AED)\n    • Thực hành ESG & Chứng nhận Xanh (Icon Chiếc lá sinh thái - Màu Xanh lá #16A34A)\n    • Kết nối Công nghệ & Đối tác B2B (Icon Hội nhóm đối tác - Màu Vàng hổ phách #D97706)", space_after=6)
    add_bullet("Biểu mẫu đăng ký tư vấn tích hợp tự động thu thập thông tin doanh nghiệp (Họ tên, SĐT, Email, Tên công ty, Nhu cầu cụ thể) và chuyển dữ liệu trực tiếp về bảng Leads bên trong Admin.", "Thu thập nhu cầu tư vấn (Lead Generation): ");
    add_bullet("Khu vực nổi bật trình chiếu sự kiện sắp diễn ra kèm đồng hồ đếm ngược trực tiếp theo thời gian thực (NGÀY - GIỜ - PHÚT - GIÂY). Tự động cập nhật trạng thái khi sự kiện bắt đầu diễn ra hoặc đã kết thúc.", "Top Sự kiện & Countdown Timer: ");
    add_bullet("Hiển thị tin bài phân tích kinh tế mới nhất. Tự động lấy chính xác ảnh bìa đã tải lên của từng bài viết (nếu không có ảnh sẽ lấy ảnh mặc định sang trọng, có cơ chế onError chống vỡ ảnh).", "Khối Tin tức & Phóng sự Tạp chí: ");
    add_bullet("Trình chiếu các doanh nghiệp hội viên tiêu biểu đã xác minh. Nút 'Xem hồ sơ doanh nghiệp' chuyển hướng mượt mà sang trang danh bạ hội viên `/members`.", "Cộng đồng Doanh nghiệp Tiêu biểu: ");
    add_bullet("Tương thích hoàn hảo chuẩn PWA. Tự động hiển thị banner gợi ý cài đặt ứng dụng lên màn hình chính điện thoại (Android/iOS) và máy tính, chạy toàn màn hình, mượt mà và hỗ trợ offline cache cơ bản.", "Cài đặt ứng dụng PWA (Progressive Web App): ");

    # 3.2 Event Engine
    add_heading_2("3.2. Phân hệ Quản Lý Sự Kiện & Phát Hành Vé QR (Event & Ticketing Engine)")
    add_p("Đây là phân hệ cốt lõi được nâng cấp toàn diện nhằm đáp ứng nhu cầu tổ chức hội thảo, diễn đàn giao thương thực tế của Tạp chí:")
    add_bullet("Hệ thống tự động phát hiện các sự kiện đã qua thời gian tổ chức hoặc ở trạng thái 'completed', lập tức thay thế form đăng ký bằng thông báo 'Sự kiện đã kết thúc' và chặn đăng ký ở cả frontend lẫn backend API.", "Tự động khóa đăng ký sự kiện đã kết thúc: ");
    add_bullet("Khi người tham dự điền form đăng ký sự kiện miễn phí, hệ thống tự động sinh mã vé duy nhất (Ví dụ: `DNVN-10-ZD22VRJ`) và hiển thị ngay mã QR Code định danh để người dùng lưu lại hoặc in vé.", "Quy trình Vé Miễn phí (Nhận vé ngay): ");
    add_bullet("Quy trình 2 bước khép kín và an toàn tuyệt đối:", "Quy trình Vé Có phí (Tích hợp VietQR & Duyệt bill thanh toán): ");
    add_p("    1. Bước 1: Khi nhấn Đăng ký, hệ thống hiển thị thông tin thanh toán kèm mã VietQR tự động sinh (đúng số tiền vé, đúng số tài khoản Techcombank của ADT và đúng cú pháp chuyển khoản theo mã vé).\n    2. Bước 2: Bắt buộc người dùng tải lên ảnh chụp màn hình chuyển khoản thành công (payment_proof). Sau khi gửi ảnh, màn hình thông báo 'Đã gửi thông tin thanh toán! Trạng thái: Chờ duyệt thanh toán'.\n    3. Bước 3: Trong Dashboard cá nhân của người đăng ký, mã QR vé sẽ bị ẩn hoàn toàn để chống gian lận, thay vào đó là khung cảnh báo 'VÉ ĐANG CHỜ DUYỆT THANH TOÁN' kèm link xem lại ảnh bill đã gửi.\n    4. Bước 4: Khi Admin hoặc Ban tổ chức kiểm tra ảnh bill hợp lệ và chuyển trạng thái sang 'Đã thanh toán', mã QR vé chính thức mới xuất hiện trong Dashboard của người tham dự.", space_after=6)
    add_bullet("Tích hợp camera trực tiếp trên trình duyệt (hỗ trợ cả camera trước/sau trên điện thoại). Chỉ cần đưa mã QR vé trước camera, hệ thống tự động nhận diện, kiểm tra tính hợp lệ và ghi nhận check-in tức thì.", "Hệ thống Quét mã QR Check-in Realtime: ");
    add_bullet("Bảng danh sách người tham gia hỗ trợ lọc theo trạng thái thanh toán, lọc check-in, tìm kiếm theo tên, SĐT, mã vé hoặc tên công ty; cho phép check-in vé thủ công khi người tham gia quên mã QR.", "Quản lý danh sách & Check-in thủ công: ");

    # 3.3 Member Dashboard
    add_heading_2("3.3. Phân hệ Cổng Doanh Nghiệp Hội Viên (Member Portal)")
    add_bullet("Doanh nghiệp đăng ký hồ sơ pháp lý, mã số thuế, đại diện pháp luật, lĩnh vực hoạt động. Sau khi nộp hồ sơ, tài khoản ở trạng thái 'pending' chờ Ban Biên tập thẩm định.", "Đăng ký & Thẩm định Hội viên: ");
    add_bullet("Phân hạng hội viên theo 3 cấp độ với các đặc quyền rõ ràng:", "Hệ thống Phân hạng Tier (Silver / Gold / Platinum): ");
    add_p("    • Hạng Silver: Được đăng tối đa 3 bài viết/tháng, hồ sơ showroom cơ bản.\n    • Hạng Gold: Được đăng tối đa 15 bài viết/tháng, ưu tiên hiển thị trong danh bạ.\n    • Hạng Platinum: Không giới hạn số bài viết đăng tải, được quyền gửi yêu cầu ghim bài nổi bật lên trang chủ, biểu tượng huy hiệu Platinum danh giá.", space_after=6)
    add_bullet("Trình soạn thảo bài viết chuyên nghiệp, tải ảnh bìa đại diện, phân loại chuyên mục & lĩnh vực, lưu bản nháp (Draft) hoặc gửi xuất bản.", "Đăng bài & Xuất bản tin tức doanh nghiệp: ");
    add_bullet("Theo dõi toàn bộ các vé sự kiện đã đăng ký, xem trạng thái duyệt thanh toán, in vé tham dự hoặc xuất trình mã QR check-in tại quầy lễ tân.", "Quản lý vé sự kiện cá nhân: ");

    # 3.4 Content Creator
    add_heading_2("3.4. Phân hệ Biên Tập Viên / Tòa Soạn (Content Creator Portal)")
    add_bullet("Tách biệt hoàn toàn với thành viên thông thường qua cổng truy cập riêng `/creator-login`.", "Cổng làm việc chuyên biệt: ");
    add_bullet("Hỗ trợ viết bài chuẩn cấu trúc báo chí, phân loại theo 7 Chuyên mục chính và hàng chục lĩnh vực chi tiết, gắn thẻ tags, thông tin tác giả và nguồn bài viết.", "Soạn thảo bài viết chuẩn tòa soạn: ");
    add_bullet("Tài khoản BTV có thể được cấu hình 'Yêu cầu duyệt' (gửi bài chờ Tổng biên tập duyệt) hoặc 'Xuất bản trực tiếp' (dành cho biên tập viên kỳ cựu).", "Phân quyền kiểm duyệt linh hoạt: ");
    add_bullet("Thống kê số lượng bài đã duyệt, bài nháp, bài chờ duyệt và tổng lượt xem thực tế của các bài viết do mình phụ trách.", "Thống kê hiệu quả tin bài: ");

    # 3.5 Organizer & Inspector
    add_heading_2("3.5. Phân hệ Ban Tổ Chức & Nhân Viên Soát Vé (Organizer & Inspector)")
    add_bullet("Tài khoản Ban tổ chức đăng nhập tại `/organizer-login`. Có toàn quyền tạo sự kiện mới, chỉnh sửa thông tin, giá vé, xem danh sách đăng ký, mở ảnh bill chuyển khoản và duyệt thanh toán trực tiếp, sử dụng chức năng soát vé.", "Vai trò Ban Tổ Chức (Organizer): ");
    add_bullet("Tài khoản chuyên trách cho nhân viên lễ tân/bảo vệ tại cổng sự kiện:", "Vai trò Nhân Viên Soát Vé (Ticket Inspector): ");
    add_p("    • Được tạo chung trong bảng Ban tổ chức của Admin với lựa chọn chức vụ 'Nhân viên soát vé'.\n    • Chỉ được xem danh sách sự kiện và truy cập tính năng Quét mã QR / Check-in vé.\n    • Bị ẩn hoàn toàn nút 'Tạo sự kiện mới', nút Sửa và nút Xóa sự kiện.\n    • Backend API chặn nghiêm ngặt các thao tác ghi dữ liệu sự kiện đối với vai trò này.\n    • Dữ liệu check-in đồng bộ tức thì 100% với tài khoản Admin và Ban tổ chức.", space_after=6)
    add_bullet("Trong bảng danh sách người đăng ký sự kiện, cả BTC và Admin đều có nút 'Xem bill' màu tím đối với các vé đã tải ảnh thanh toán. Bấm vào sẽ mở popup xem ảnh chụp biên lai to rõ kèm nút 'Duyệt đã thanh toán' tiện lợi.", "Tính năng Xem ảnh Bill & Duyệt nhanh: ");

    # 3.6 Super Admin
    add_heading_2("3.6. Phân hệ Quản Trị Hệ Thống Toàn Diện (Super Admin Portal)")
    add_p("Trung tâm điều hành tối cao dành cho Ban Biên tập Tạp chí Doanh Nghiệp Việt Nam tại `/admin-dashboard`:")
    add_bullet("Biểu đồ và chỉ số tổng quan: Tổng số Hội viên, Tổng bài viết, Tổng sự kiện, Doanh thu vé, Số lượt check-in thực tế, Yêu cầu tư vấn mới.", "Dashboard Thống kê Tổng thể: ");
    add_bullet("Xét duyệt hồ sơ hội viên mới, nâng/hạ cấp Tier (Silver/Gold/Platinum), tạm khóa hoặc kích hoạt tài khoản doanh nghiệp.", "Quản lý Hội viên Doanh nghiệp: ");
    add_bullet("Duyệt tin bài chờ duyệt từ Hội viên và BTV, chỉnh sửa nội dung, ghim bài lên vị trí nổi bật trang chủ (Featured), xóa bài vi phạm.", "Quản lý Bài viết & Tin tức: ");
    add_bullet("Đổi trạng thái thanh toán từ dạng click-toggle cũ sang dạng Dropdown chọn nhanh (`Miễn phí`, `Chờ thanh toán`, `Đã thanh toán`, `Hủy vé`). Tích hợp nút xem ảnh bill và duyệt thanh toán.", "Quản trị Sự kiện & Bảng vé: ");
    add_bullet("Tạo và quản lý tài khoản với trường chọn chức vụ: 'Ban tổ chức' hoặc 'Nhân viên soát vé'.", "Quản lý Ban tổ chức & Soát vé: ");
    add_bullet("Tạo tài khoản phóng viên/BTV, phân quyền xuất bản tự động hay cần duyệt.", "Quản lý Biên tập viên: ");
    add_bullet("Tiếp nhận và theo dõi các yêu cầu gửi về từ form 6 trụ cột ngoài trang chủ, phân loại trạng thái xử lý (Chờ xử lý, Đang liên hệ, Đã hoàn tất).", "Quản lý Khách hàng tiềm năng (Leads): ");
    add_bullet("Quản lý 7 chuyên mục lớn và danh mục con, chỉnh sửa thông tin ngân hàng Techcombank, cấu hình thương hiệu và tài khoản SMTP gửi mail.", "Cấu hình Danh mục & Hệ thống: ");

    # 3.7 AI Assistant
    add_heading_2("3.7. Phân hệ Trợ Lý Trí Tuệ Nhân Tạo (AI Advisor & RAG Assistant)")
    add_bullet("Trợ lý AI được huấn luyện theo Persona chuyên gia cố vấn của Tạp chí Doanh Nghiệp Việt Nam, có kiến thức sâu rộng về Luật Doanh nghiệp, Luật Đầu tư, chính sách thuế, các gói tín dụng ưu đãi, chuyển đổi số ERP và tiêu chuẩn xanh ESG.", "Trí tuệ Nhân tạo Chuyên sâu: ");
    add_bullet("Tích hợp mô hình ngôn ngữ lớn Google Gemini tiên tiến với tốc độ phản hồi tính bằng mili-giây, am hiểu tiếng Việt và văn hóa kinh doanh nội địa.", "Tích hợp Google Gemini API: ");
    add_bullet("Cung cấp các chủ đề gợi ý sẵn (Vốn vay ngân hàng, Truyền thông báo chí, AI cho doanh nghiệp, Báo cáo ESG) giúp người dùng đặt câu hỏi nhanh chỉ với một cú nhấp chuột.", "Gợi ý câu hỏi thông minh: ");

    # ==========================================
    # PHẦN 4: HẠ TẦNG KỸ THUẬT & BẢO MẬT
    # ==========================================
    add_heading_1("4. NỀN TẢNG CÔNG NGHỆ, BẢO MẬT VÀ VẬN HÀNH")

    tech_stack = [
        ("Frontend", "React 19, Vite, Tabler Icons, Progressive Web App (PWA), Service Worker, QR Scanner Engine."),
        ("Backend", "Node.js (LTS), Express Framework, RESTful API architecture."),
        ("Cơ sở dữ liệu", "MySQL Server, chuẩn hóa bảng quan hệ (InnoDB, utf8mb4), tối ưu đánh chỉ mục Indexing."),
        ("Bảo mật tài khoản", "Mã hóa mật khẩu 1 chiều bằng bcrypt (10 rounds salt), xác thực phiên làm việc qua JWT (JSON Web Token)."),
        ("Tích hợp ngân hàng", "VietQR tiêu chuẩn Napas 247, mã hóa QR thanh toán tự động với tài khoản Techcombank."),
        ("Dịch vụ Thư điện tử", "Nodemailer SMTP tích hợp gửi email thông báo vé, xác thực và phục hồi mật khẩu tự động."),
        ("Máy chủ & Hạ tầng", "Linux VPS, Nginx Reverse Proxy, SSL Let's Encrypt (Force HTTPS), quản lý tiến trình bằng PM2.")
    ]

    for comp, desc in tech_stack:
        add_bullet(desc, f"{comp}: ")

    # ==========================================
    # PHẦN 5: KẾT LUẬN & CAM KẾT
    # ==========================================
    add_heading_1("5. ĐÁNH GIÁ CHẤT LƯỢNG VÀ KẾ HOẠCH BÀN GIAO")
    add_p(
        "Nền tảng số DoanhNghiepVN.today đã được hoàn thiện 100% các tính năng nghiệp vụ theo đúng yêu cầu đề ra. Hệ thống vận hành ổn định, tốc độ phản hồi nhanh, giao diện thân thiện trên mọi thiết bị (máy tính, máy tính bảng, điện thoại di động) và sẵn sàng chuyển giao chính thức sang tên miền https://doanhnghiepvn.today/.",
        bold_prefix="Đánh giá tổng thể: "
    )
    add_p(
        "Công ty Cổ phần ADT Quốc tế cam kết đồng hành, bảo hành kỹ thuật, hỗ trợ sao lưu dữ liệu định kỳ và tiếp tục nâng cấp các tính năng thông minh theo định hướng phát triển của Ban Biên tập Tạp chí Doanh Nghiệp Việt Nam.",
        bold_prefix="Cam kết hỗ trợ kỹ thuật: "
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Signatures Table
    tbl_sig = doc.add_table(rows=3, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sig.autofit = False

    s_c1 = tbl_sig.rows[0].cells[0]
    s_c2 = tbl_sig.rows[0].cells[1]
    s_c1.width = Inches(3.25)
    s_c2.width = Inches(3.25)
    set_cell_margins(s_c1, 40, 40, 60, 60)
    set_cell_margins(s_c2, 40, 40, 60, 60)

    p_s1 = s_c1.paragraphs[0]
    p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_s1.add_run("ĐẠI DIỆN ĐƠN VỊ PHÁT TRIỂN\nCÔNG TY CỔ PHẦN ADT QUỐC TẾ\n\n\n\n(Ký và ghi rõ họ tên)")
    r_s1.font.name = "Arial"
    r_s1.font.size = Pt(10)
    r_s1.font.bold = True
    r_s1.font.color.rgb = RGBColor(15, 23, 42)

    p_s2 = s_c2.paragraphs[0]
    p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s2 = p_s2.add_run("ĐẠI DIỆN ĐƠN VỊ TIẾP NHẬN\nTẠP CHÍ DOANH NGHIỆP VIỆT NAM\n\n\n\n(Ký và ghi rõ họ tên)")
    r_s2.font.name = "Arial"
    r_s2.font.size = Pt(10)
    r_s2.font.bold = True
    r_s2.font.color.rgb = RGBColor(15, 23, 42)

    output_path = "e:/ADT/doanhnghiepvn-today/TAI_LIEU_TONG_QUAN_TINH_NANG_DOANHNGHIEPVN_TODAY.docx"
    doc.save(output_path)
    print(f"File created successfully at: {output_path}")

if __name__ == "__main__":
    create_document()
