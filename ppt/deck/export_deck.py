import os
import win32com.client

def export_deck():
    ppt_path = os.path.abspath("ppt/deck/CivicPulse_Round1.pptx")
    pdf_path = os.path.abspath("ppt/deck/CivicPulse_Round1.pdf")
    qa_dir = os.path.abspath("ppt/qa")
    os.makedirs(qa_dir, exist_ok=True)

    print("Connecting to PowerPoint Application...")
    powerpoint = win32com.client.Dispatch("PowerPoint.Application")
    
    # Open presentation (read-only, untitled, with window hidden)
    # WithWindow=False
    presentation = powerpoint.Presentations.Open(ppt_path, ReadOnly=True, Untitled=False, WithWindow=False)

    try:
        # SaveAs format 32 = ppSaveAsPDF
        print(f"Exporting to PDF: {pdf_path}...")
        presentation.SaveAs(pdf_path, 32)
        print("PDF export successful!")

        # Export individual slides as PNG (1920x1080)
        print("Exporting slides to PNG for QA...")
        for i, slide in enumerate(presentation.Slides, start=1):
            slide_png = os.path.join(qa_dir, f"slide_{i}.png")
            slide.Export(slide_png, "PNG", 1920, 1080)
            print(f"Exported Slide {i} to {slide_png}")

    finally:
        presentation.Close()
        powerpoint.Quit()

if __name__ == "__main__":
    export_deck()

