import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# Brand Palette
TEAL = RGBColor(15, 118, 110)       # #0F766E Primary Brand
NAVY = RGBColor(23, 43, 54)        # #172B36 Navy Ink
GOLD = RGBColor(202, 138, 4)       # #CA8A04 Accent
SAGE = RGBColor(245, 248, 247)     # #F5F8F7 Background
WHITE = RGBColor(255, 255, 255)    # #FFFFFF Surface
MUTED = RGBColor(71, 85, 105)      # #475569 Secondary Text
SLATE = RGBColor(100, 116, 139)    # #64748B Subtext / Sources
BORDER = RGBColor(227, 233, 234)   # #E3E9EA Soft Border
CRITICAL = RGBColor(220, 38, 38)   # #DC2626 Critical Priority
SUCCESS = RGBColor(21, 128, 61)    # #15803D Success
CARD_BG = RGBColor(255, 255, 255)

FONT_HEADING = "Geist"
FONT_BODY = "Geist"
FONT_MONO = "Consolas"

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Speaker Notes dictionary
    notes = {
        1: (
            "This is Asha. Every evening, she walks home from the bus stop in Bengaluru along an unlit residential "
            "street. Over two weeks, she reported the broken streetlight three separate times on the municipal portal. "
            "Each report became a disconnected ticket in an unranked queue of sixty complaints on the desk of Kavitha, "
            "the ward engineer.\n\n"
            "In five and a half months of 2025, Bengaluru recorded over 126,000 civic grievances. Streetlights alone "
            "made up over 31%, while road maintenance resolved only 58%. The problem isn't that citizens don't care, "
            "or that engineers don't work. The problem is that reports pile up blindly."
        ),
        2: (
            "Today, municipal portals operate on a first-come, first-served queue. When an issue goes unresolved, "
            "citizens file it again and again. This artificially inflates backlogs. More dangerously, it blinds engineers: "
            "a critical safety hazard filed today sits behind a cosmetic repair filed last week. And because citizens "
            "never receive updates, trust collapses.\n\n"
            "CivicPulse changes this path completely. A citizen reports with free text and a map pin. Our AI understands "
            "the context, our Duplicate Radar surfaces existing reports, our deterministic engine scores the urgency, "
            "and officers dispatch targeted action."
        ),
        3: (
            "Trust requires complete explainability. We divide responsibilities strictly: AI suggests, code decides, "
            "people confirm.\n\n"
            "First, Google Gemini reads the unstructured text to identify category, safety flags, and a neutral summary. "
            "If the AI is ever offline, a deterministic keyword fallback takes over immediately.\n\n"
            "Second, Duplicate Radar compares coordinates and semantic embeddings within 500 meters and 30 days. "
            "Instead of filing duplicates, neighbors tap 'Add my voice'.\n\n"
            "Finally, our Priority Receipt calculates a transparent 0-to-100 score using seven auditable factors. "
            "Gemini has zero influence on this score. Ward engineers retain full authority to confirm or adjust."
        ),
        4: (
            "CivicPulse is not a concept deck. It is an operational system running right now on production infrastructure.\n\n"
            "On the left, citizens file reports via our clean mobile wizard, receiving immediate AI categorization and "
            "duplicate alerts. In the center, ward engineers manage a ranked queue where urgent public hazards "
            "immediately rise to the top with SLA countdowns. On the right, live geospatial maps highlight ward clusters.\n\n"
            "You can test this yourself right now at civicpulse.vercel.app with one-click demo logins for citizens, "
            "engineers, and administrators."
        ),
        5: (
            "We built CivicPulse sustainably on open public technologies: Next.js, Firebase, Gemini API, MapLibre, "
            "and OpenFreeMap, running entirely on ₹0 free-tier infrastructure.\n\n"
            "We use open datasets from OpenCity and DataMeet, and evaluate on 240 synthetic complaints where we have "
            "already prevented 18% duplicate inflation and reduced triage to under three seconds.\n\n"
            "Our next step is a single-ward pilot with voice support for Kannada and Hindi.\n\n"
            "The streetlight Asha walked past is now fixed. Reported once. Prioritised. Fixed. And Asha knew. Thank you."
        )
    }

    # ==========================================
    # SLIDE 1: Cover & Problem
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    s1.notes_slide.notes_text_frame.text = notes[1]
    
    # Background
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = SAGE
    bg1.line.color.rgb = SAGE

    # Left Hero Image (56% width)
    hero_img = "ppt/assets/images/s1_hero_dark_streetlight.jpg"
    if os.path.exists(hero_img):
        img_shape = s1.shapes.add_picture(hero_img, Inches(0.65), Inches(0.65), Inches(6.8), Inches(6.2))

    # Right Content Card (Container)
    right_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.65), Inches(0.65), Inches(5.03), Inches(6.2))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = WHITE
    right_card.line.color.rgb = BORDER
    right_card.line.width = Pt(1.5)

    # Right Text Frame
    tb = s1.shapes.add_textbox(Inches(7.95), Inches(0.85), Inches(4.43), Inches(5.8))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    # Header / Logo
    p0 = tf.paragraphs[0]
    p0.text = "CIVICPULSE AI"
    p0.font.name = FONT_HEADING
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = TEAL

    p_tag = tf.add_paragraph()
    p_tag.text = "Turning citizen voices into intelligent city action"
    p_tag.font.name = FONT_BODY
    p_tag.font.size = Pt(12)
    p_tag.font.color.rgb = MUTED
    p_tag.space_after = Pt(14)

    # Title
    p_t = tf.add_paragraph()
    p_t.text = "A streetlight, reported three times"
    p_t.font.name = FONT_HEADING
    p_t.font.size = Pt(28)
    p_t.font.bold = True
    p_t.font.color.rgb = NAVY
    p_t.space_after = Pt(14)

    # Asha story
    p_story = tf.add_paragraph()
    p_story.text = "Asha reported the dark streetlight near her bus stop three times in two weeks. Each report sat unranked in a 60-ticket queue."
    p_story.font.name = FONT_BODY
    p_story.font.size = Pt(14)
    p_story.font.color.rgb = NAVY
    p_story.line_spacing = 1.35

    p_scen = tf.add_paragraph()
    p_scen.text = "(Illustrative scenario)"
    p_scen.font.name = FONT_BODY
    p_scen.font.size = Pt(11)
    p_scen.font.color.rgb = SLATE
    p_scen.space_after = Pt(18)

    # Stats block in 3 columns
    # We create distinct textboxes for crisp metrics
    col_w = Inches(1.4)
    stats_data = [
        ("126,974", "BBMP grievances in ~5.5 months"),
        ("31.4%", "Streetlights of total complaints"),
        ("58%", "Road maintenance resolved"),
    ]
    for idx, (num, lbl) in enumerate(stats_data):
        st_box = s1.shapes.add_textbox(Inches(7.95 + idx * 1.48), Inches(3.9), Inches(1.42), Inches(1.3))
        st_f = st_box.text_frame
        st_f.word_wrap = True
        st_f.margin_left = st_f.margin_top = st_f.margin_right = st_f.margin_bottom = 0
        p_num = st_f.paragraphs[0]
        p_num.text = num
        p_num.font.name = FONT_HEADING
        p_num.font.size = Pt(26)
        p_num.font.bold = True
        p_num.font.color.rgb = TEAL
        p_lbl = st_f.add_paragraph()
        p_lbl.text = lbl
        p_lbl.font.name = FONT_BODY
        p_lbl.font.size = Pt(11)
        p_lbl.font.color.rgb = MUTED
        p_lbl.line_spacing = 1.15

    # Source citation
    src_box = s1.shapes.add_textbox(Inches(7.95), Inches(5.35), Inches(4.43), Inches(0.4))
    sf = src_box.text_frame
    sf.word_wrap = True
    sf.margin_left = sf.margin_top = sf.margin_right = sf.margin_bottom = 0
    p_src = sf.paragraphs[0]
    p_src.text = "Source: OpenCity analysis of BBMP data, Jul 2025."
    p_src.font.name = FONT_BODY
    p_src.font.size = Pt(11)
    p_src.font.color.rgb = SLATE

    # Persona chips
    p_box = s1.shapes.add_textbox(Inches(7.95), Inches(5.85), Inches(4.43), Inches(0.55))
    pf = p_box.text_frame
    pf.word_wrap = True
    pf.margin_left = pf.margin_top = pf.margin_right = pf.margin_bottom = 0
    p_per = pf.paragraphs[0]
    p_per.text = "Personas: Citizen (Asha) · Ward engineer (Kavitha)"
    p_per.font.name = FONT_BODY
    p_per.font.size = Pt(12)
    p_per.font.bold = True
    p_per.font.color.rgb = NAVY
    p_subp = pf.add_paragraph()
    p_subp.text = "Independent civic-tech prototype · Not affiliated with government"
    p_subp.font.name = FONT_BODY
    p_subp.font.size = Pt(10)
    p_subp.font.color.rgb = SLATE

    # ==========================================
    # SLIDE 2: Problem & Solution Workflow
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    s2.notes_slide.notes_text_frame.text = notes[2]

    bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg2.fill.solid()
    bg2.fill.fore_color.rgb = SAGE
    bg2.line.color.rgb = SAGE

    # Title & Subtitle
    tb2 = s2.shapes.add_textbox(Inches(0.65), Inches(0.65), Inches(12.03), Inches(1.1))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = tf2.margin_bottom = 0
    
    p2_t = tf2.paragraphs[0]
    p2_t.text = "Reports pile up. Nothing gets ranked."
    p2_t.font.name = FONT_HEADING
    p2_t.font.size = Pt(30)
    p2_t.font.bold = True
    p2_t.font.color.rgb = NAVY

    p2_sub = tf2.add_paragraph()
    p2_sub.text = "CivicPulse turns every report into ranked, located action."
    p2_sub.font.name = FONT_BODY
    p2_sub.font.size = Pt(16)
    p2_sub.font.bold = True
    p2_sub.font.color.rgb = TEAL

    # Left Column: Today (Static First-Come Queues)
    c_today = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.65), Inches(1.9), Inches(3.6), Inches(4.95))
    c_today.fill.solid()
    c_today.fill.fore_color.rgb = WHITE
    c_today.line.color.rgb = BORDER
    c_today.line.width = Pt(1.5)

    tb_today = s2.shapes.add_textbox(Inches(0.95), Inches(2.15), Inches(3.0), Inches(4.4))
    tf_today = tb_today.text_frame
    tf_today.word_wrap = True
    tf_today.margin_left = tf_today.margin_top = tf_today.margin_right = tf_today.margin_bottom = 0

    p_th = tf_today.paragraphs[0]
    p_th.text = "TODAY: FIRST-COME QUEUES"
    p_th.font.name = FONT_HEADING
    p_th.font.size = Pt(12)
    p_th.font.bold = True
    p_th.font.color.rgb = CRITICAL
    p_th.space_after = Pt(16)

    pain_points = [
        ("Duplicate inflation", "Same broken light filed repeatedly, bloating unranked backlogs."),
        ("Blind queues", "Critical public hazards wait buried behind cosmetic tasks."),
        ("Citizen silence", "No updates sent back, destroying trust and triggering re-reports.")
    ]

    for title, desc in pain_points:
        p_pt = tf_today.add_paragraph()
        p_pt.text = f"• {title}"
        p_pt.font.name = FONT_HEADING
        p_pt.font.size = Pt(15)
        p_pt.font.bold = True
        p_pt.font.color.rgb = NAVY
        p_pt.space_after = Pt(2)

        p_pd = tf_today.add_paragraph()
        p_pd.text = desc
        p_pd.font.name = FONT_BODY
        p_pd.font.size = Pt(13)
        p_pd.font.color.rgb = MUTED
        p_pd.line_spacing = 1.3
        p_pd.space_after = Pt(14)

    # Right Diagram: 5-step workflow
    flow_img = "ppt/assets/diagrams/s2_flow_5step.png"
    if os.path.exists(flow_img):
        s2.shapes.add_picture(flow_img, Inches(4.5), Inches(1.9), Inches(8.18), Inches(4.95))

    # ==========================================
    # SLIDE 3: AI Intelligence & Priority Receipt
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    s3.notes_slide.notes_text_frame.text = notes[3]

    bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg3.fill.solid()
    bg3.fill.fore_color.rgb = SAGE
    bg3.line.color.rgb = SAGE

    tb3 = s3.shapes.add_textbox(Inches(0.65), Inches(0.55), Inches(12.03), Inches(1.0))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    tf3.margin_left = tf3.margin_top = tf3.margin_right = tf3.margin_bottom = 0

    p3_t = tf3.paragraphs[0]
    p3_t.text = "AI suggests. Code decides. People confirm."
    p3_t.font.name = FONT_HEADING
    p3_t.font.size = Pt(30)
    p3_t.font.bold = True
    p3_t.font.color.rgb = NAVY

    p3_sub = tf3.add_paragraph()
    p3_sub.text = "Transparent civic triage with zero black-box scoring."
    p3_sub.font.name = FONT_BODY
    p3_sub.font.size = Pt(16)
    p3_sub.font.bold = True
    p3_sub.font.color.rgb = TEAL

    # Three pillars strip
    pillars_img = "ppt/assets/diagrams/s3_three_pillars.png"
    if os.path.exists(pillars_img):
        s3.shapes.add_picture(pillars_img, Inches(0.65), Inches(1.65), Inches(12.03), Inches(1.65))

    # Signature Priority Receipt
    receipt_img = "ppt/assets/illustrations/s3_priority_receipt.png"
    if os.path.exists(receipt_img):
        s3.shapes.add_picture(receipt_img, Inches(2.2), Inches(3.45), Inches(8.93), Inches(3.55))

    # ==========================================
    # SLIDE 4: Working Prototype Evidence
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    s4.notes_slide.notes_text_frame.text = notes[4]

    bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg4.fill.solid()
    bg4.fill.fore_color.rgb = SAGE
    bg4.line.color.rgb = SAGE

    tb4 = s4.shapes.add_textbox(Inches(0.65), Inches(0.55), Inches(12.03), Inches(1.0))
    tf4 = tb4.text_frame
    tf4.word_wrap = True
    tf4.margin_left = tf4.margin_top = tf4.margin_right = tf4.margin_bottom = 0

    p4_t = tf4.paragraphs[0]
    p4_t.text = "It works today"
    p4_t.font.name = FONT_HEADING
    p4_t.font.size = Pt(30)
    p4_t.font.bold = True
    p4_t.font.color.rgb = NAVY

    p4_sub = tf4.add_paragraph()
    p4_sub.text = "A verified prototype deployed on production free tiers."
    p4_sub.font.name = FONT_BODY
    p4_sub.font.size = Pt(16)
    p4_sub.font.bold = True
    p4_sub.font.color.rgb = TEAL

    # Visual 1: Mobile Citizen Wizard Mockup (Left)
    phone_mockup = "ppt/assets/illustrations/mockup_phone_wizard.png"
    if os.path.exists(phone_mockup):
        s4.shapes.add_picture(phone_mockup, Inches(0.65), Inches(1.75), Inches(2.35), Inches(4.35))
    
    lbl1 = s4.shapes.add_textbox(Inches(0.65), Inches(6.15), Inches(2.35), Inches(0.45))
    l1_f = lbl1.text_frame
    l1_f.word_wrap = True
    l1_f.margin_left = l1_f.margin_top = l1_f.margin_right = l1_f.margin_bottom = 0
    p_l1 = l1_f.paragraphs[0]
    p_l1.text = "Mobile Citizen Wizard\nAI suggestion & location"
    p_l1.font.name = FONT_BODY
    p_l1.font.size = Pt(11)
    p_l1.font.bold = True
    p_l1.font.color.rgb = NAVY
    p_l1.alignment = PP_ALIGN.CENTER

    # Visual 2: Authority Queue Laptop Mockup (Center)
    queue_mockup = "ppt/assets/illustrations/mockup_laptop_queue.png"
    if os.path.exists(queue_mockup):
        s4.shapes.add_picture(queue_mockup, Inches(3.25), Inches(1.75), Inches(5.6), Inches(3.65))

    lbl2 = s4.shapes.add_textbox(Inches(3.25), Inches(5.5), Inches(5.6), Inches(0.45))
    l2_f = lbl2.text_frame
    l2_f.word_wrap = True
    l2_f.margin_left = l2_f.margin_top = l2_f.margin_right = l2_f.margin_bottom = 0
    p_l2 = l2_f.paragraphs[0]
    p_l2.text = "Authority Triage Queue · Ranked 0-100 tickets with SLA countdowns"
    p_l2.font.name = FONT_BODY
    p_l2.font.size = Pt(12)
    p_l2.font.bold = True
    p_l2.font.color.rgb = NAVY
    p_l2.alignment = PP_ALIGN.CENTER

    # Visual 3: Judge Access Card & QR Code (Right)
    qr_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.1), Inches(1.75), Inches(3.58), Inches(4.35))
    qr_card.fill.solid()
    qr_card.fill.fore_color.rgb = WHITE
    qr_card.line.color.rgb = BORDER
    qr_card.line.width = Pt(1.5)

    qr_img = "ppt/assets/diagrams/qr_civicpulse.png"
    if os.path.exists(qr_img):
        s4.shapes.add_picture(qr_img, Inches(10.0), Inches(2.0), Inches(1.78), Inches(1.78))

    qr_text = s4.shapes.add_textbox(Inches(9.3), Inches(3.95), Inches(3.18), Inches(2.0))
    qtf = qr_text.text_frame
    qtf.word_wrap = True
    qtf.margin_left = qtf.margin_top = qtf.margin_right = qtf.margin_bottom = 0
    
    pq_url = qtf.paragraphs[0]
    pq_url.text = "civicpulse.vercel.app"
    pq_url.font.name = FONT_HEADING
    pq_url.font.size = Pt(15)
    pq_url.font.bold = True
    pq_url.font.color.rgb = TEAL
    pq_url.alignment = PP_ALIGN.CENTER
    pq_url.space_after = Pt(8)

    pq_j = qtf.add_paragraph()
    pq_j.text = "Judge Access: 1-Click Demo Roles"
    pq_j.font.name = FONT_BODY
    pq_j.font.size = Pt(13)
    pq_j.font.bold = True
    pq_j.font.color.rgb = NAVY
    pq_j.alignment = PP_ALIGN.CENTER

    pq_r = qtf.add_paragraph()
    pq_r.text = "Citizen · Roads Authority · Admin\nPre-seeded with 240 active reports"
    pq_r.font.name = FONT_BODY
    pq_r.font.size = Pt(11)
    pq_r.font.color.rgb = MUTED
    pq_r.alignment = PP_ALIGN.CENTER
    pq_r.line_spacing = 1.3

    # Bottom Journey Strip
    j_strip = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.25), Inches(6.05), Inches(5.6), Inches(0.55))
    j_strip.fill.solid()
    j_strip.fill.fore_color.rgb = WHITE
    j_strip.line.color.rgb = BORDER
    j_strip.line.width = Pt(1)

    j_tb = s4.shapes.add_textbox(Inches(3.35), Inches(6.12), Inches(5.4), Inches(0.4))
    jtf = j_tb.text_frame
    jtf.word_wrap = True
    jtf.margin_left = jtf.margin_top = jtf.margin_right = jtf.margin_bottom = 0
    p_jt = jtf.paragraphs[0]
    p_jt.text = "Citizen reports  →  AI analyses  →  Duplicate linked  →  Engineer resolves  →  Citizen notified"
    p_jt.font.name = FONT_BODY
    p_jt.font.size = Pt(10)
    p_jt.font.bold = True
    p_jt.font.color.rgb = NAVY
    p_jt.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 5: Architecture, Data & Honest Scale
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    s5.notes_slide.notes_text_frame.text = notes[5]

    bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg5.fill.solid()
    bg5.fill.fore_color.rgb = SAGE
    bg5.line.color.rgb = SAGE

    tb5 = s5.shapes.add_textbox(Inches(0.65), Inches(0.55), Inches(12.03), Inches(1.0))
    tf5 = tb5.text_frame
    tf5.word_wrap = True
    tf5.margin_left = tf5.margin_top = tf5.margin_right = tf5.margin_bottom = 0

    p5_t = tf5.paragraphs[0]
    p5_t.text = "Built free, built to scale, built honestly"
    p5_t.font.name = FONT_HEADING
    p5_t.font.size = Pt(30)
    p5_t.font.bold = True
    p5_t.font.color.rgb = NAVY

    p5_sub = tf5.add_paragraph()
    p5_sub.text = "Open civic technology on ₹0 infrastructure."
    p5_sub.font.name = FONT_BODY
    p5_sub.font.size = Pt(16)
    p5_sub.font.bold = True
    p5_sub.font.color.rgb = TEAL

    # Architecture strip
    arch_img = "ppt/assets/diagrams/s5_architecture_strip.png"
    if os.path.exists(arch_img):
        s5.shapes.add_picture(arch_img, Inches(0.65), Inches(1.65), Inches(12.03), Inches(1.4))

    # Left Container: Data Sources & Licences
    c_data = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.65), Inches(3.2), Inches(5.85), Inches(2.45))
    c_data.fill.solid()
    c_data.fill.fore_color.rgb = WHITE
    c_data.line.color.rgb = BORDER
    c_data.line.width = Pt(1.5)

    tb_d = s5.shapes.add_textbox(Inches(0.95), Inches(3.38), Inches(5.25), Inches(2.1))
    tfd = tb_d.text_frame
    tfd.word_wrap = True
    tfd.margin_left = tfd.margin_top = tfd.margin_right = tfd.margin_bottom = 0

    pd_h = tfd.paragraphs[0]
    pd_h.text = "OPEN DATA SOURCES & LICENCES"
    pd_h.font.name = FONT_HEADING
    pd_h.font.size = Pt(12)
    pd_h.font.bold = True
    pd_h.font.color.rgb = TEAL
    pd_h.space_after = Pt(8)

    datasets = [
        ("BBMP Grievance Records", "OpenCity.in analysis (Jul 2025)"),
        ("Bengaluru Ward Boundaries", "DataMeet Community Maps (CC BY 4.0)"),
        ("Base Vector Maps", "OpenFreeMap / OpenStreetMap (ODbL)"),
        ("Synthetic Evaluation Data", "240 seeded reports labelled 'Demo data'")
    ]
    for d_name, d_lic in datasets:
        p_item = tfd.add_paragraph()
        p_item.text = f"• {d_name}: "
        p_item.font.name = FONT_BODY
        p_item.font.size = Pt(12)
        p_item.font.bold = True
        p_item.font.color.rgb = NAVY
        
        # Add run for licence text
        run = p_item.add_run()
        run.text = d_lic
        run.font.bold = False
        run.font.color.rgb = MUTED
        p_item.space_after = Pt(3)

    # Right Container: Impact & Prototype Evaluation
    c_imp = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.83), Inches(3.2), Inches(5.85), Inches(2.45))
    c_imp.fill.solid()
    c_imp.fill.fore_color.rgb = WHITE
    c_imp.line.color.rgb = BORDER
    c_imp.line.width = Pt(1.5)

    tb_imp = s5.shapes.add_textbox(Inches(7.13), Inches(3.38), Inches(5.25), Inches(2.1))
    tfimp = tb_imp.text_frame
    tfimp.word_wrap = True
    tfimp.margin_left = tfimp.margin_top = tfimp.margin_right = tfimp.margin_bottom = 0

    pi_h = tfimp.paragraphs[0]
    pi_h.text = "PROTOTYPE IMPACT & NEXT STEPS"
    pi_h.font.name = FONT_HEADING
    pi_h.font.size = Pt(12)
    pi_h.font.bold = True
    pi_h.font.color.rgb = TEAL
    pi_h.space_after = Pt(8)

    # 3 Metrics in row
    m_data = [
        ("240", "Reports analysed"),
        ("18%", "Duplicates averted"),
        ("< 3s", "Median triage time"),
    ]
    for idx, (val, txt) in enumerate(m_data):
        m_box = s5.shapes.add_textbox(Inches(7.13 + idx * 1.75), Inches(3.85), Inches(1.65), Inches(0.9))
        mf = m_box.text_frame
        mf.word_wrap = True
        mf.margin_left = mf.margin_top = mf.margin_right = mf.margin_bottom = 0
        p_mv = mf.paragraphs[0]
        p_mv.text = val
        p_mv.font.name = FONT_HEADING
        p_mv.font.size = Pt(22)
        p_mv.font.bold = True
        p_mv.font.color.rgb = TEAL
        p_mt = mf.add_paragraph()
        p_mt.text = txt
        p_mt.font.name = FONT_BODY
        p_mt.font.size = Pt(11)
        p_mt.font.color.rgb = MUTED

    p_next = tfimp.add_paragraph()
    p_next.text = "Labelled Prototype data · Single-ward municipal pilot with Hindi & Kannada support."
    p_next.font.name = FONT_BODY
    p_next.font.size = Pt(11)
    p_next.font.color.rgb = SLATE
    p_next.space_before = Pt(65)

    # Bottom Climax Strip (Asha's closing resolution)
    climax_card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.65), Inches(5.82), Inches(12.03), Inches(1.05))
    climax_card.fill.solid()
    climax_card.fill.fore_color.rgb = NAVY
    climax_card.line.color.rgb = NAVY

    # Thumbnail of lit street on left of strip
    lit_img = "ppt/assets/images/s5_accent_lit_streetlight.jpg"
    if os.path.exists(lit_img):
        s5.shapes.add_picture(lit_img, Inches(0.85), Inches(5.92), Inches(1.5), Inches(0.85))

    tb_climax = s5.shapes.add_textbox(Inches(2.6), Inches(6.05), Inches(9.8), Inches(0.65))
    tfc = tb_climax.text_frame
    tfc.word_wrap = True
    tfc.margin_left = tfc.margin_top = tfc.margin_right = tfc.margin_bottom = 0

    pc = tfc.paragraphs[0]
    pc.text = "Reported once. Prioritised. Fixed. And Asha knew."
    pc.font.name = FONT_HEADING
    pc.font.size = Pt(20)
    pc.font.bold = True
    pc.font.color.rgb = WHITE

    pc_sub = tfc.add_paragraph()
    pc_sub.text = "CivicPulse AI · INNOVATE Online Hackathon 2026 by Aveeranex on Unstop"
    pc_sub.font.name = FONT_BODY
    pc_sub.font.size = Pt(11)
    pc_sub.font.color.rgb = GOLD

    deck_path = "ppt/deck/CivicPulse_Round1.pptx"
    prs.save(deck_path)
    print(f"Presentation saved successfully to: {deck_path}")

if __name__ == "__main__":
    create_deck()

