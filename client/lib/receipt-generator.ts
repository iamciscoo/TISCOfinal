import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Exchange rate (approximate, should be updated regularly)
const TZS_TO_USD = 1 / 2500

interface OrderItem {
  id: string
  quantity: number
  price: number
  product_id?: string
  products?: {
    id: string
    name: string
    price: number
    image_url: string | null
  } | null
}

interface User {
  first_name?: string | null
  last_name?: string | null
  email?: string
  phone?: string | null
}

interface Order {
  id: string
  created_at: string
  total_amount: number
  status: string
  payment_status?: string
  payment_method?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  shipping_address?: string | null
  notes?: string | null
  order_items?: OrderItem[]
  user?: User | null
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
 * Generate PDF receipt for an order
 */
export async function generateOrderReceipt(order: Order): Promise<jsPDF> {
  const doc = new jsPDF()
  
  // Document properties
  doc.setProperties({
    title: `Receipt - Order #${order.id.slice(0, 8)}`,
    subject: 'Order Receipt',
    author: 'TISCO Market Place',
    keywords: 'receipt, order, invoice',
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
  // ASCII-only to avoid undefined glyphs in built-in fonts
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
  doc.text('ORDER RECEIPT', pageWidth - 20, 25, { align: 'right' })
  
  yPos = 62

  // ===========================
  // ORDER INFO SECTION
  // ===========================
  
  doc.setTextColor(55, 65, 81) // #374151
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Order Information', 20, yPos)
  
  yPos += 6
  
  // Order details in two columns
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  
  const leftCol = 20
  const rightCol = 110
  
  // Left column
  doc.setFont('helvetica', 'bold')
  doc.text('Order ID:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(`#${order.id.slice(0, 8)}...`, leftCol + 22, yPos)
  
  yPos += 4.5
  doc.setFont('helvetica', 'bold')
  doc.text('Order Date:', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(order.created_at), leftCol + 22, yPos)
  
  // Right column
  yPos = 67
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Status:', rightCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text((order.payment_status || 'pending').toUpperCase(), rightCol + 32, yPos)
  
  yPos += 4.5
  if (order.payment_method) {
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Method:', rightCol, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(order.payment_method, rightCol + 32, yPos)
    yPos += 4.5
  }
  
  yPos = Math.max(yPos, 76) + 3

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
  const customerName = order.user
    ? (`${order.user.first_name ?? ''} ${order.user.last_name ?? ''}`).trim() || 'Guest Customer'
    : (order.customer_name || 'Guest Customer')
  
  const customerEmail = order.user?.email || order.customer_email || 'N/A'
  const customerPhone = order.user?.phone || order.customer_phone || 'N/A'
  
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
  
  if (order.shipping_address) {
    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('Address:', leftCol, yPos)
    doc.setFont('helvetica', 'normal')
    
    // Wrap address text
    const addressLines = doc.splitTextToSize(order.shipping_address, pageWidth - leftCol - 28)
    doc.text(addressLines, leftCol + 22, yPos)
    yPos += (addressLines.length * 3.5)
  }
  
  yPos += 6

  // ===========================
  // ORDER ITEMS TABLE
  // ===========================
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('Order Items', 20, yPos)
  
  yPos += 3
  
  const items = order.order_items || []
  const tableData = items.map((item, index) => {
    const product = item.products
    const productName = truncate(product?.name || `Product ${item.product_id?.slice(0, 8) || item.id.slice(0, 8)}`)
    const quantity = item.quantity
    const unitPrice = Number(item.price)
    const totalPrice = unitPrice * quantity
    
    return [
      (index + 1).toString(),
      productName,
      quantity.toString(),
      formatCurrency(unitPrice, 'TZS'),
      formatCurrency(totalPrice, 'TZS')
    ]
  })

  // Add table using autoTable
  const footerReserve = items.length <= 10 ? 28 : 30 // space for footer
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Product Name', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    pageBreak: items.length > 10 ? 'auto' : 'avoid',
    rowPageBreak: 'auto',
    headStyles: {
      fillColor: [15, 23, 42], // #0f172a
      textColor: [255, 255, 255],
      fontSize: items.length <= 10 ? 8 : 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: items.length <= 10 ? 2.5 : 3
    },
    bodyStyles: {
      fontSize: items.length <= 10 ? 7.5 : 8,
      textColor: [55, 65, 81],
      cellPadding: items.length <= 10 ? 2.5 : 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 75, overflow: (items.length <= 10 ? 'ellipsize' : 'linebreak') } as any,
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' }
    },
    // Reserve space at page bottom for footer to prevent overlap
    margin: { left: 20, right: 20, bottom: footerReserve },
    didDrawPage: function() {
      // This is called after each page, we'll use finalY after the table
    }
  })
  
  // Get position after table
  yPos = (doc as any).lastAutoTable.finalY + (items.length <= 10 ? 6 : 8)

  // ===========================
  // TOTALS SECTION
  // ===========================
  
  const totalTZS = Number(order.total_amount)
  const totalUSD = convertToUSD(totalTZS)
  
  // Create totals box
  const totalsBoxX = pageWidth - 90
  let totalsBoxY = yPos
  const totalsBoxWidth = 70
  
  // Ensure totals + optional notes fit on page, otherwise move to next page
  const approxNotesLines = order.notes ? (doc.splitTextToSize(order.notes, pageWidth - 40).length) : 0
  const approxNotesHeight = order.notes ? (5 + approxNotesLines * 3 + 6) : 0
  const totalsSectionHeight = 28 + 8 // box + spacing
  const spaceNeeded = totalsSectionHeight + approxNotesHeight + 10
  if (items.length > 10 && (totalsBoxY + spaceNeeded > pageHeight - footerReserve)) {
    doc.addPage()
    yPos = 20
    totalsBoxY = yPos
  }

  // Box background
  doc.setFillColor(248, 250, 252) // #f8fafc
  doc.setDrawColor(226, 232, 240) // #e2e8f0
  doc.rect(totalsBoxX, totalsBoxY, totalsBoxWidth, 28, 'FD')
  
  // Total in TZS
  yPos = totalsBoxY + 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81)
  doc.text('TOTAL (TZS):', totalsBoxX + 5, yPos)
  doc.text(formatCurrency(totalTZS, 'TZS'), totalsBoxX + totalsBoxWidth - 5, yPos, { align: 'right' })
  
  // Total in USD
  yPos += 5.5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128) // #6b7280
  doc.text('Approx. USD:', totalsBoxX + 5, yPos)
  doc.text(formatCurrency(totalUSD, 'USD'), totalsBoxX + totalsBoxWidth - 5, yPos, { align: 'right' })
  
  // Exchange rate note
  yPos += 4
  doc.setFontSize(6.5)
  doc.setTextColor(156, 163, 175) // #9ca3af
  doc.text('Rate: 1 USD ~= 2,500 TZS', totalsBoxX + 5, yPos)
  
  yPos = totalsBoxY + 32

  // ===========================
  // NOTES SECTION (if exists)
  // ===========================
  
  if (order.notes && order.notes.trim()) {
    yPos = totalsBoxY + 32
    const notesLinesAll = doc.splitTextToSize(order.notes, pageWidth - 40)
    const remainHeight = (pageHeight - footerReserve) - yPos - 8
    const fullNotesHeight = notesLinesAll.length * 3
    // Only add page for notes if items > 10 AND notes don't fit
    if (items.length > 10 && fullNotesHeight > remainHeight) {
      doc.addPage()
      yPos = 20
    }
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(55, 65, 81)
    doc.text('Notes:', 20, yPos)
    
    yPos += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    // For <=10 items, limit notes to fit on page; for >10, show all
    const maxLines = items.length <= 10 ? Math.floor(remainHeight / 3) : notesLinesAll.length
    const displayLines = notesLinesAll.slice(0, maxLines)
    doc.text(displayLines, 20, yPos)
    yPos += displayLines.length * 3
  } else {
    yPos = totalsBoxY + 32
  }

  // ===========================
  // FOOTER SECTION
  // ===========================
  
  // Draw footer anchored to bottom of page
  yPos = pageHeight - (items.length <= 10 ? 36 : 40)
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
 * Generate and download receipt
 */
export async function downloadReceipt(order: Order): Promise<void> {
  const doc = await generateOrderReceipt(order)
  doc.save(`TISCO-Receipt-${order.id.slice(0, 8)}.pdf`)
}
