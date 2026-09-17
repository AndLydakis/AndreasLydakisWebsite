from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


OUTPUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "cv.pdf"


def build_pdf() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = letter
    document = canvas.Canvas(str(OUTPUT), pagesize=letter)
    document.setTitle("Placeholder CV - Replace Before Launch")

    margin = 54
    content_width = page_width - (margin * 2)
    document.setFillColor(colors.HexColor("#171226"))
    document.rect(0, 0, page_width, page_height, fill=1, stroke=0)

    document.setFillColor(colors.HexColor("#ffe29a"))
    document.setFont("Helvetica-Bold", 17)
    document.drawString(margin, page_height - 78, "PLACEHOLDER CV - REPLACE BEFORE LAUNCH")

    document.setFillColor(colors.HexColor("#f8f4ff"))
    document.setFont("Helvetica", 10)
    document.drawString(margin, page_height - 132, "This one-page PDF is intentionally fictional placeholder content.")
    document.drawString(margin, page_height - 148, "Replace it with the owner's approved CV before publishing.")

    y = page_height - 198
    sections = [
        ("PROFILE", "PLACEHOLDER PROFILE - replace with a professional summary."),
        ("EXPERIENCE", "PLACEHOLDER ROLE - replace with role, company, dates, and impact."),
        ("SKILLS", "PLACEHOLDER SKILL - replace with approved skills and technologies."),
        ("CONTACT", "PLACEHOLDER CONTACT - replace with approved contact details."),
    ]

    for heading, body in sections:
        document.setStrokeColor(colors.HexColor("#8d70bd"))
        document.roundRect(margin, y - 42, content_width, 58, 6, fill=0, stroke=1)
        document.setFillColor(colors.HexColor("#ffe29a"))
        document.setFont("Helvetica-Bold", 10)
        document.drawString(margin + 12, y, heading)
        document.setFillColor(colors.HexColor("#cbc1e6"))
        document.setFont("Helvetica", 9)
        document.drawString(margin + 12, y - 20, body)
        y -= 78

    document.setFillColor(colors.HexColor("#62e6ff"))
    document.setFont("Helvetica-Oblique", 8)
    document.drawString(margin, 42, "Generated for development only - not a real CV.")
    document.save()


if __name__ == "__main__":
    build_pdf()
