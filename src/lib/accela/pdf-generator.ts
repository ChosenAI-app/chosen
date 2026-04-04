import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export interface FormFillData {
  formName: string
  fields: Record<string, string | boolean | null>
}

export async function generatePermitPDFPackage(
  fills: FormFillData[],
  projectAddress: string,
  homeownerName: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Cover page
  const coverPage = pdfDoc.addPage([612, 792])
  const { height } = coverPage.getSize()

  coverPage.drawText("CHOSEN", { x: 50, y: height - 60, size: 24, font: boldFont })
  coverPage.drawText("Permit Application Package", { x: 50, y: height - 90, size: 16, font })
  coverPage.drawText(`Property: ${projectAddress}`, { x: 50, y: height - 130, size: 12, font })
  coverPage.drawText(`Applicant: ${homeownerName}`, { x: 50, y: height - 150, size: 12, font })
  coverPage.drawText(`Generated: ${new Date().toLocaleDateString()}`, { x: 50, y: height - 170, size: 12, font })
  coverPage.drawText("Prepared by Chosen AI — chosenai.com", { x: 50, y: height - 190, size: 10, font })

  coverPage.drawText("Contents:", { x: 50, y: height - 240, size: 14, font: boldFont })
  fills.forEach((fill, i) => {
    coverPage.drawText(`${i + 1}. ${fill.formName}`, { x: 70, y: height - 265 - i * 20, size: 11, font })
  })

  // One page per form
  for (const fill of fills) {
    let page = pdfDoc.addPage([612, 792])
    let y = height - 60

    page.drawText(fill.formName, { x: 50, y, size: 14, font: boldFont })
    y -= 25
    page.drawText(`Property: ${projectAddress}`, { x: 50, y, size: 10, font })
    y -= 15
    page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    for (const [key, val] of Object.entries(fill.fields)) {
      if (val === null || val === "") continue
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      const value = String(val) === "true" ? "Yes" : String(val) === "false" ? "No" : String(val)

      page.drawText(`${label}:`, { x: 60, y, size: 9, font: boldFont })
      page.drawText(value, { x: 230, y, size: 9, font })
      y -= 16

      if (y < 80) {
        page = pdfDoc.addPage([612, 792])
        y = height - 60
      }
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
