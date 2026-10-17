import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideV w:val="none"/>\n'
        f'  <w:left w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(tblBorders)

def add_callout(doc, text, title=None):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F1F5F9")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    # Left border highlight
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="2563EB"/>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    if title:
        run_title = p.add_run(f"{title}: ")
        run_title.bold = True
        run_title.font.name = "Calibri"
        run_title.font.size = Pt(10)
        run_title.font.color.rgb = RGBColor(37, 99, 235)
        
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(30, 41, 59)
    
    # Empty space after callout
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(6)

def build_word_document():
    doc = Document()
    
    # Page setup: Standard Letter, 0.8 in margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        # Header / Footer
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_hdr = p_hdr.add_run("OmniDash Business Analytics · Comprehensive User Manual")
        r_hdr.font.name = "Calibri"
        r_hdr.font.size = Pt(8.5)
        r_hdr.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = section.footer
        p_ftr = footer.paragraphs[0]
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r_ftr_l = p_ftr.add_run("Confidential · Internal Executive Reference")
        r_ftr_l.font.name = "Calibri"
        r_ftr_l.font.size = Pt(8.5)
        r_ftr_l.font.color.rgb = RGBColor(148, 163, 184)
    
    # Cover / Header Title Block
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("OmniDash Business Intelligence")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(26)
    r_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub = p_sub.add_run("End-to-End User Guide, Feature Deep-Dive & Architecture Reference")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(37, 99, 235) # Primary Blue
    
    # Metadata Pill Box
    add_callout(doc, "Platform: 100% Zero-Backend Browser Runtime · Version: 2.0.0 · Air-Gapped Ready · SingleFile HTML Edition Available", "DOCUMENT METADATA")
    
    # Overview image if exists
    img_dash = os.path.join("docs", "screenshots", "dashboard_executive_view.png")
    if os.path.exists(img_dash):
        doc.add_picture(img_dash, width=Inches(6.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(14)
        r_cap = p_cap.add_run("Figure 1.1: OmniDash Executive Boardroom Dashboard Interface")
        r_cap.font.name = "Calibri"
        r_cap.font.size = Pt(8.5)
        r_cap.font.italic = True
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    # Read USER_GUIDE.md content and translate cleanly into Word
    with open(os.path.join("docs", "USER_GUIDE.md"), "r", encoding="utf-8") as f:
        md_text = f.read()

    lines = md_text.splitlines()
    in_table = False
    table_rows = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip top header title from MD since we created a custom banner
        if line.startswith("# OmniDash — End-to-End User Guide") or line.startswith("> **The Definitive Manual") or line.startswith("*Version:"):
            i += 1
            continue
            
        # Detect headings
        if line.startswith("## "):
            h_text = line.replace("## ", "").strip()
            # Clean number prefix
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(18)
            p_h.paragraph_format.space_after = Pt(6)
            p_h.paragraph_format.keep_with_next = True
            r = p_h.add_run(h_text)
            r.bold = True
            r.font.name = "Calibri"
            r.font.size = Pt(16)
            r.font.color.rgb = RGBColor(15, 23, 42)
            i += 1
            continue
            
        if line.startswith("### "):
            h_text = line.replace("### ", "").strip()
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(14)
            p_h.paragraph_format.space_after = Pt(4)
            p_h.paragraph_format.keep_with_next = True
            r = p_h.add_run(h_text)
            r.bold = True
            r.font.name = "Calibri"
            r.font.size = Pt(12.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
            i += 1
            continue
            
        if line.startswith("#### "):
            h_text = line.replace("#### ", "").strip()
            p_h = doc.add_paragraph()
            p_h.paragraph_format.space_before = Pt(10)
            p_h.paragraph_format.space_after = Pt(3)
            p_h.paragraph_format.keep_with_next = True
            r = p_h.add_run(h_text)
            r.bold = True
            r.font.name = "Calibri"
            r.font.size = Pt(11)
            r.font.color.rgb = RGBColor(37, 99, 235)
            i += 1
            continue

        # Detect images in Markdown
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
        if img_match:
            alt_text = img_match.group(1)
            raw_path = img_match.group(2).replace("./", "docs/")
            if os.path.exists(raw_path):
                # Don't duplicate first dashboard view if already inserted
                if not ("dashboard_executive_view.png" in raw_path and i < 40):
                    doc.add_picture(raw_path, width=Inches(6.4))
                    p_cap = doc.add_paragraph()
                    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_cap.paragraph_format.space_before = Pt(3)
                    p_cap.paragraph_format.space_after = Pt(12)
                    r_cap = p_cap.add_run(f"{alt_text}")
                    r_cap.font.name = "Calibri"
                    r_cap.font.size = Pt(8.5)
                    r_cap.font.italic = True
                    r_cap.font.color.rgb = RGBColor(100, 116, 139)
            i += 1
            continue

        # Detect Markdown Table
        if line.startswith("|") and line.endswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                table_lines.append(lines[i].strip())
                i += 1
            
            if len(table_lines) >= 2:
                # Parse headers and rows
                raw_headers = [c.strip() for c in table_lines[0].split("|")[1:-1]]
                data_rows = []
                for row_line in table_lines[2:]: # skip separator line
                    cells = [c.strip() for c in row_line.split("|")[1:-1]]
                    data_rows.append(cells)
                
                # Create Word table
                table = doc.add_table(rows=len(data_rows) + 1, cols=len(raw_headers))
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(table)
                
                # Style header
                hdr_cells = table.rows[0].cells
                for col_idx, h_text in enumerate(raw_headers):
                    hdr_cells[col_idx].text = h_text
                    set_cell_background(hdr_cells[col_idx], "1E293B") # Dark slate
                    set_cell_margins(hdr_cells[col_idx], top=80, bottom=80, left=100, right=100)
                    for p in hdr_cells[col_idx].paragraphs:
                        for run in p.runs:
                            run.font.name = "Calibri"
                            run.font.size = Pt(9.5)
                            run.font.bold = True
                            run.font.color.rgb = RGBColor(255, 255, 255)
                
                # Style body rows
                for r_idx, row_data in enumerate(data_rows):
                    row_cells = table.rows[r_idx + 1].cells
                    bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                    for c_idx, cell_value in enumerate(row_data):
                        if c_idx < len(row_cells):
                            # Clean markdown bold/backticks
                            clean_val = cell_value.replace("**", "").replace("`", "")
                            row_cells[c_idx].text = clean_val
                            set_cell_background(row_cells[c_idx], bg_color)
                            set_cell_margins(row_cells[c_idx], top=60, bottom=60, left=100, right=100)
                            for p in row_cells[c_idx].paragraphs:
                                for run in p.runs:
                                    run.font.name = "Calibri"
                                    run.font.size = Pt(9)
                                    run.font.color.rgb = RGBColor(30, 41, 59)
                
                p_spacer = doc.add_paragraph()
                p_spacer.paragraph_format.space_before = Pt(2)
                p_spacer.paragraph_format.space_after = Pt(8)
            continue

        # Bullet point lists
        if line.startswith("* ") or line.startswith("- "):
            bullet_text = line[2:].strip()
            p_bullet = doc.add_paragraph(style='List Bullet')
            p_bullet.paragraph_format.space_before = Pt(1)
            p_bullet.paragraph_format.space_after = Pt(2)
            p_bullet.paragraph_format.line_spacing = 1.15
            
            # Simple bold parsing (e.g. **Bold**: normal)
            parts = re.split(r'(\*\*.*?\*\*)', bullet_text)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p_bullet.add_run(part[2:-2])
                    r.bold = True
                else:
                    r = p_bullet.add_run(part.replace("`", ""))
                r.font.name = "Calibri"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(30, 41, 59)
            i += 1
            continue

        # Numbered lists
        num_match = re.match(r'^(\d+)\.\s+(.*)', line)
        if num_match:
            num_idx = num_match.group(1)
            num_text = num_match.group(2)
            p_num = doc.add_paragraph(style='List Number')
            p_num.paragraph_format.space_before = Pt(1)
            p_num.paragraph_format.space_after = Pt(2)
            p_num.paragraph_format.line_spacing = 1.15
            
            parts = re.split(r'(\*\*.*?\*\*)', num_text)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p_num.add_run(part[2:-2])
                    r.bold = True
                else:
                    r = p_num.add_run(part.replace("`", ""))
                r.font.name = "Calibri"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(30, 41, 59)
            i += 1
            continue

        # Code block skip or formatting
        if line.startswith("```"):
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1 # skip ending ```
            
            code_text = "\n".join(code_lines)
            tbl_c = doc.add_table(rows=1, cols=1)
            tbl_c.alignment = WD_TABLE_ALIGNMENT.CENTER
            tbl_c.columns[0].width = Inches(6.5)
            c_cell = tbl_c.cell(0, 0)
            set_cell_background(c_cell, "0F172A") # Midnight
            set_cell_margins(c_cell, top=100, bottom=100, left=140, right=140)
            p_c = c_cell.paragraphs[0]
            r_c = p_c.add_run(code_text)
            r_c.font.name = "Consolas"
            r_c.font.size = Pt(8.5)
            r_c.font.color.rgb = RGBColor(226, 232, 240)
            
            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_before = Pt(2)
            p_sp.paragraph_format.space_after = Pt(6)
            continue

        # Regular paragraph
        if line and not line.startswith("---") and not line.startswith("Table of Contents"):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.2
            
            parts = re.split(r'(\*\*.*?\*\*)', line)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    r = p.add_run(part[2:-2])
                    r.bold = True
                else:
                    r = p.add_run(part.replace("`", ""))
                r.font.name = "Calibri"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(51, 65, 85)
        
        i += 1
        
    out_path = os.path.join("docs", "OmniDash_Executive_User_Guide.docx")
    doc.save(out_path)
    print(f"Successfully generated: {out_path} ({os.path.getsize(out_path)} bytes)")
    
    # Also copy to OmniDash_Email_Package
    pkg_path = os.path.join("OmniDash_Email_Package", "OmniDash_Executive_User_Guide.docx")
    doc.save(pkg_path)
    print(f"Successfully saved to email package: {pkg_path}")

if __name__ == "__main__":
    build_word_document()
