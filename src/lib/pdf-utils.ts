import { PDFDocument } from 'pdf-lib'

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
        const fileBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(fileBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    return await mergedPdf.save()
}
