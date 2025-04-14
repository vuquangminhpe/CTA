/* eslint-disable @typescript-eslint/no-explicit-any */
import { Download, Printer } from 'lucide-react'
import { jsPDF } from 'jspdf'

const QRCodeList = ({ qrCodes, examTitle = 'Exam' }: any) => {
  if (!qrCodes || qrCodes.length === 0) {
    return null
  }

  const handleDownloadQR = (qrCode: any) => {
    const link = document.createElement('a')
    link.href = qrCode.qrCode
    link.download = `${examTitle.replace(/\s+/g, '-')}-${qrCode.exam_code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printAllQRCodes = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()

    const margin = 10
    const qrSize = (pageWidth - margin * 4) / 3 // 3 QR codes per row
    const qrPerPage = 9 // 3x3 grid

    // Add a title
    pdf.setFontSize(16)
    pdf.text(examTitle, pageWidth / 2, margin, { align: 'center' })

    for (let i = 0; i < qrCodes.length; i += qrPerPage) {
      if (i !== 0) {
        pdf.addPage()
        pdf.text(examTitle, pageWidth / 2, margin, { align: 'center' })
      }

      const batch = qrCodes.slice(i, i + qrPerPage)

      batch.forEach((qrCode: any, index: any) => {
        const row = Math.floor(index / 3)
        const col = index % 3

        const x = margin + col * (qrSize + margin)
        const y = margin * 3 + row * (qrSize + margin + 10) // Extra space for the text below

        // Add QR code
        pdf.addImage(qrCode.qrCode, 'PNG', x, y, qrSize, qrSize)

        // Add exam code
        pdf.setFontSize(10)
        pdf.text(`Code: ${qrCode.exam_code}`, x + qrSize / 2, y + qrSize + 5, { align: 'center' })
      })
    }

    pdf.save(`${examTitle.replace(/\s+/g, '-')}-QR-Codes.pdf`)
  }

  return (
    <div className='mt-8'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>Generated QR Codes</h3>
        <div className='flex space-x-2'>
          <button
            onClick={printAllQRCodes}
            className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <Printer className='h-4 w-4 mr-1' />
            Print All
          </button>
        </div>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
        {qrCodes.map((qrCode: any, index: any) => (
          <div key={qrCode.exam_code} className='bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200'>
            <div className='p-3 text-center'>
              <img src={qrCode.qrCode} alt={`QR Code ${index + 1}`} className='mx-auto max-w-full h-auto' />
              <p className='mt-2 text-xs font-medium text-gray-700'>Code: {qrCode.exam_code}</p>
            </div>
            <div className='px-2 py-2 bg-gray-50 flex justify-center'>
              <button
                onClick={() => handleDownloadQR(qrCode)}
                className='inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 focus:outline-none'
                title='Download'
              >
                <Download className='h-4 w-4' />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className='mt-4 text-sm text-gray-500'>
        Total: {qrCodes.length} QR codes generated. Use the print button to print all QR codes at once.
      </p>
    </div>
  )
}

export default QRCodeList
