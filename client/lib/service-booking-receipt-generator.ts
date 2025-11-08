import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Exchange rate (approximate, should be updated regularly)
const TZS_TO_USD = 1 / 2500

interface ServiceCostItem {
  id: string
  name: string
  unit_price: number
  quantity: number
  unit: string
}

interface ServiceCosts {
  id: string
  service_fee: number
  discount: number
  currency: string
  subtotal: number
  total: number
  notes: string | null
  items: ServiceCostItem[]
}

interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

interface Service {
  id: string
  title: string
  description: string
  features: string[]
  duration: string
  image?: string
}

interface ServiceBooking {
  id: string
  service_type: string
  description?: string
  status: string
  payment_status?: string
  total_amount: number
  preferred_date?: string
  preferred_time?: string
  contact_email: string
  contact_phone?: string
  customer_name: string
  notes?: string
  created_at: string
  updated_at: string
  services?: Service | null
  users?: Customer
}

interface ServiceBookingReceiptData {
  booking: ServiceBooking
  serviceCosts: ServiceCosts | null
}

/**
 * Format currency for receipts
 */
function formatCurrency(amount: number, currency: 'TZS' | 'USD' = 'TZS'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`
  }
  return `TZS ${Math.round(amount).toLocaleString()}`
}

/**
 * Convert TZS to USD
 */
function convertToUSD(amountTZS: number): number {
  return amountTZS * TZS_TO_USD
}

/**
 * Truncate long text safely for single-line cells
 */
function truncate(text: string, max: number = 48): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max - 3) + '...' : text
}

/**
 * Format date in East African Time
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Dar_es_Salaam',
    timeZoneName: 'short'
  })
}

/**
 * Generate PDF receipt for a service booking
 */
export async function generateServiceBookingReceipt(data: ServiceBookingReceiptData): Promise<jsPDF> {
  const { booking, serviceCosts } = data
  const doc = new jsPDF()
  
  // Document properties
  doc.setProperties({
    title: `Service Receipt - Booking #${booking.id.slice(0, 8)}`,
    subject: 'Service Booking Receipt',
    author: 'TISCO Market Place',
    keywords: 'receipt, service, booking, invoice',
    creator: 'TISCO System'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ===========================
  // HEADER SECTION
  // ===========================
  
  // Dark header background
  doc.setFillColor(15, 23, 42) // #0f172a
  doc.rect(0, 0, pageWidth, 55, 'F')
  
  // Load and add logo image
  try {
    const logoImg = await fetch('/logo-96.png').then(r => r.blob())
    const logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(logoImg)
    })
    // Add circular logo (20x20mm)
    doc.addImage(logoDataUrl, 'PNG', 14, 13, 20, 20)
  } catch (error) {
    console.warn('Could not load logo, using text fallback:', error)
    // Fallback: Draw circle with text
    doc.setFillColor(255, 255, 255, 0.14)
    doc.circle(23, 22, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text('TISCO', 23, 21, { align: 'center' })
    doc.setFontSize(5)
    doc.text('Market Place', 23, 24, { align: 'center' })
  }
  
  // Company title and tagline
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('TISCO Market Place', 37, 21)
  
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225) // #cbd5e1
  doc.text('Your Trusted Online Marketplace', 37, 28)
  doc.text('Tech - Rare Finds - Services - Delivered Across Tanzania', 37, 33)

  // Receipt title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVICE RECEIPT', pageWidth - 20, 25, { align: 'right' })
  
  yPos = 62

  // ===========================
  // BOOKING INFO SECTION
  // ===========================
  
  doc.setTextColor(55, 65, 81) // #374151
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Booking Information', 20, yPos)
  
  yPos += 6
  
  // Booking details in two columns
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  
  const leftCol = 20
  const rightCol = 110
  
  // Left column
  doc.setFont('helvetica', 'bold')
  doc.text('Booking ID:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${booking.id.slice(0, 8)}...`, leftCol + 22, yPos)
  
  yPos += 4.5
  doc.setFont('helvetica', 'bold')
  doc.text('Booking Date:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(booking.created_at), leftCol + 22, yPos)
  
  // Right column
  yPos = 71
  doc.setFont('helvetica', 'bold')
  doc.text('Status:', rightCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(booking.status.replace(/_/g, ' ').toUpperCase(), rightCol + 32, yPos)
  
  yPos += 4.5
  if (booking.payment_status) {
    doc.setFont('helvetica', 'bold')
    doc.text('Payment:', rightCol, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(booking.payment_status.toUpperCase(), rightCol + 32, yPos)
    yPos += 4.5
  }
  
  yPos = Math.max(yPos, 80) + 3

  // ===========================
  // CUSTOMER SECTION
  // ===========================
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('Customer Details', 20, yPos)
  
  yPos += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  // Customer name
  const customer = booking.users
  const customerName = customer 
    ? [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email
    : booking.customer_name || 'Guest Customer'
  
  const customerEmail = customer?.email || booking.contact_email
  const customerPhone = customer?.phone || booking.contact_phone || 'N/A'
  
  doc.setFont('helvetica', 'bold')
  doc.text('Name:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(customerName, leftCol + 22, yPos)
  
  yPos += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Email:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(customerEmail, leftCol + 22, yPos)
  
  yPos += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Phone:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(customerPhone, leftCol + 22, yPos)
  
  if (customer && customer.address_line_1) {
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Address:', leftCol, yPos)
    doc.setFont('helvetica', 'normal')
    
    // Build address string
    const addressParts = [
      customer.address_line_1,
      customer.address_line_2,
      customer.city,
      customer.state,
      customer.postal_code,
      customer.country
    ].filter(Boolean)
    const addressStr = addressParts.join(', ')
    
    // Wrap address text
    const addressLines = doc.splitTextToSize(addressStr, pageWidth - leftCol - 28)
    doc.text(addressLines, leftCol + 22, yPos)
    yPos += (addressLines.length * 3.5)
  }
  
  yPos += 6

  // ===========================
  // SERVICE DETAILS SECTION
  // ===========================
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('Service Details', 20, yPos)
  
  yPos += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const service = booking.services
  const serviceTitle = service?.title || booking.service_type || 'Service'
  
  doc.setFont('helvetica', 'bold')
  doc.text('Service:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(serviceTitle, leftCol + 22, yPos)
  
  if (service?.duration) {
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Duration:', leftCol, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(service.duration, leftCol + 22, yPos)
  }
  
  if (booking.preferred_date && booking.preferred_time) {
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Scheduled:', leftCol, yPos)
    doc.setFont('helvetica', 'normal')
    const scheduledDateTime = `${booking.preferred_date}T${booking.preferred_time}`
    doc.text(formatDate(scheduledDateTime), leftCol + 22, yPos)
  }
  
  if (booking.description || service?.description) {
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Description:', leftCol, yPos)
    doc.setFont('helvetica', 'normal')
    const desc = booking.description || service?.description || ''
    const descLines = doc.splitTextToSize(desc, pageWidth - leftCol - 28)
    yPos += 3
    doc.text(descLines.slice(0, 3), leftCol + 2, yPos) // Limit to 3 lines
    yPos += (Math.min(descLines.length, 3) * 3.5)
  }
  
  yPos += 6

  // ===========================
  // COST BREAKDOWN SECTION
  // ===========================
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('Cost Breakdown', 20, yPos)
  
  yPos += 6
  
  const items = serviceCosts?.items || []
  const hasItems = items.length > 0
  
  // Always show a breakdown, even if there are no itemized costs
  if (hasItems) {
    // Show items table
    const tableData = items.map((item, index) => {
      const itemName = truncate(item.name, 40)
      const quantity = `${item.quantity} ${item.unit}`
      const unitPrice = formatCurrency(item.unit_price, 'TZS')
      const totalPrice = formatCurrency(item.unit_price * item.quantity, 'TZS')
      
      return [
        (index + 1).toString(),
        itemName,
        quantity,
        unitPrice,
        totalPrice
      ]
    })

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Item', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      pageBreak: 'avoid',
      rowPageBreak: 'auto',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [55, 65, 81],
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 60, overflow: 'ellipsize' } as any,
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20, bottom: 40 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 8
  } else if (serviceCosts) {
    // No items but we have costs - show a simple breakdown
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(107, 114, 128)
    doc.text('No itemized costs recorded', 20, yPos)
    yPos += 8
  }

  // ===========================
  // TOTALS SECTION
  // ===========================
  
  const totalAmount = serviceCosts?.total || booking.total_amount
  const totalUSD = convertToUSD(totalAmount)
  
  // Create a full-width breakdown section instead of just a box
  doc.setFillColor(248, 250, 252) // #f8fafc
  doc.setDrawColor(226, 232, 240) // #e2e8f0
  doc.rect(20, yPos, pageWidth - 40, serviceCosts ? 40 : 20, 'FD')
  
  yPos += 7
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  
  if (serviceCosts) {
    // Show detailed breakdown
    const leftMargin = 30
    const rightMargin = pageWidth - 30
    
    doc.text('Subtotal:', leftMargin, yPos)
    doc.text(formatCurrency(serviceCosts.subtotal || 0, 'TZS'), rightMargin, yPos, { align: 'right' })
    
    yPos += 5
    doc.text('Service Fee:', leftMargin, yPos)
    doc.text(formatCurrency(serviceCosts.service_fee || 0, 'TZS'), rightMargin, yPos, { align: 'right' })
    
    yPos += 5
    doc.text('Discount:', leftMargin, yPos)
    doc.text(`-${formatCurrency(serviceCosts.discount || 0, 'TZS')}`, rightMargin, yPos, { align: 'right' })
    
    yPos += 2
    // Add separator line
    doc.setDrawColor(203, 213, 225)
    doc.line(leftMargin, yPos, rightMargin, yPos)
    yPos += 5
    
    // Total
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL (TZS):', leftMargin, yPos)
    doc.text(formatCurrency(serviceCosts.total || totalAmount, 'TZS'), rightMargin, yPos, { align: 'right' })
    
    // USD approximation
    yPos += 5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Approx. USD:', leftMargin, yPos)
    doc.text(formatCurrency(convertToUSD(serviceCosts.total || totalAmount), 'USD'), rightMargin, yPos, { align: 'right' })
  } else {
    // Simple total only
    const leftMargin = 30
    const rightMargin = pageWidth - 30
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL (TZS):', leftMargin, yPos)
    doc.text(formatCurrency(totalAmount, 'TZS'), rightMargin, yPos, { align: 'right' })
    
    yPos += 5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Approx. USD:', leftMargin, yPos)
    doc.text(formatCurrency(totalUSD, 'USD'), rightMargin, yPos, { align: 'right' })
  }
  
  yPos += 8

  // ===========================
  // NOTES SECTION (if exists)
  // ===========================
  
  const allNotes = [booking.notes, serviceCosts?.notes].filter(Boolean).join(' | ')
  
  if (allNotes) {
    yPos += 4
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(55, 65, 81)
    doc.text('Notes:', 20, yPos)
    
    yPos += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    const notesLines = doc.splitTextToSize(allNotes, pageWidth - 40)
    doc.text(notesLines.slice(0, 3), 20, yPos) // Limit to 3 lines
  }

  // ===========================
  // FOOTER SECTION
  // ===========================
  
  yPos = pageHeight - 36
  doc.setDrawColor(226, 232, 240)
  doc.line(20, yPos, pageWidth - 20, yPos)
  
  yPos += 6
  
  // Company info
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('TISCO Market Place', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 3.5
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('Your Trusted Online Marketplace', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 3.5
  doc.setFontSize(7)
  doc.text('Email: info@tiscomarket.store | Phone: +255 748 624 684', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 3
  doc.setFontSize(6.5)
  doc.setTextColor(156, 163, 175)
  doc.text(`(c) ${new Date().getFullYear()} TISCO Market Place. All rights reserved.`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 2.5
  doc.text(`Receipt generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPos, { align: 'center' })

  return doc
}

/**
 * Generate and download service booking receipt
 */
export async function downloadServiceBookingReceipt(data: ServiceBookingReceiptData): Promise<void> {
  const doc = await generateServiceBookingReceipt(data)
  doc.save(`TISCO-Service-Receipt-${data.booking.id.slice(0, 8)}.pdf`)
}
