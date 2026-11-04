import re
from pptx import Presentation

pptx_path = "ppt/deck/CivicPulse_Round1.pptx"
prs = Presentation(pptx_path)

HYPE_WORDS = ["revolutionary", "game-changing", "cutting-edge", "seamless", "next-gen"]

print(f"Total slides: {len(prs.slides)}")
assert len(prs.slides) == 5, f"Expected exactly 5 slides, got {len(prs.slides)}"

for idx, slide in enumerate(prs.slides, start=1):
    print(f"\n--- SLIDE {idx} AUDIT ---")
    
    # Speaker notes check
    notes_text = slide.notes_slide.notes_text_frame.text if slide.has_notes_slide else ""
    print(f"Speaker notes length: {len(notes_text)} characters, ~{len(notes_text.split())} words")
    assert len(notes_text.strip()) > 50, f"Slide {idx} missing speaker notes!"

    # Text extraction
    all_text = []
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                txt = p.text.strip()
                if txt:
                    all_text.append(txt)

    full_slide_text = " ".join(all_text)
    
    # Check hype words
    for hw in HYPE_WORDS:
        assert hw.lower() not in full_slide_text.lower(), f"Forbidden hype word found on slide {idx}: '{hw}'"
    assert "!" not in full_slide_text, f"Exclamation mark found on slide {idx}!"
    
    print("Hype words check: PASSED (No hype words, no exclamation marks)")
    
    # Word count estimation for body
    # (Excluding title and short labels)
    words = full_slide_text.split()
    print(f"Total words on slide: {len(words)}")

print("\nAutomated compliance audit PASSED successfully!")

