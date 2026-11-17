import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import { itemService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'
import { confirmDelete, confirmStatusToggle } from '../../utils/swal'

// ==========================================
// Clean, Crisp SVG Icons (Zero Emojis)
// ==========================================

function IconClose({ className = 'w-5 h-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconSearch({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconUpload({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconDownload({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconExcel({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m8 13 4 4" />
      <path d="m12 13-4 4" />
    </svg>
  )
}

function IconEdit({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

function IconTrash({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconAlertTriangle({ className = 'w-5 h-5' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconSprout({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.4 2-4.6-2.7-.1-4.2.7-5.2 2z" />
    </svg>
  )
}

// Master Categories extracted directly from the Grocery Master Inventory Sheet
const OFFICIAL_CATEGORIES = [
  'All Categories',
  'Pulses, Dals & Legumes',
  'Dry Fruits & Nuts',
  'Atta, Flours & Grains',
  'Rice & Rice Products',
  'Edible Oils & Ghee',
  'Salt, Sugar & Jaggery',
  'Spices - Whole & Ground',
  'Dairy, Packaged & Breakfast Products',
  'Packaged Snacks & Beverages',
  'Personal Care & Cleaning Essentials'
]

const UNITS = ['KG', 'Litre', 'Gram', 'Packet', 'Bag', 'Tin', 'Jar', 'Piece', 'Box', 'Quintal']

export default function ItemMaster() {
  // Real dynamic items list from MongoDB
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    packSize: '',
    unit: 'KG',
    category: 'Pulses, Dals & Legumes',
    specifications: '',
    referencePrice: '',
    status: 'Active'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Import Excel Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  // Show temporary toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Fetch real items from backend API
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setApiError('')
      const res = await itemService.getItems({
        search: searchQuery,
        category: selectedCategory === 'All Categories' ? '' : selectedCategory,
        status: selectedStatus === 'All' ? '' : selectedStatus,
        page: currentPage,
        limit: itemsPerPage
      })

      if (res.data) {
        setItems(res.data)
        setTotalCount(res.total || 0)
        setTotalPages(res.totalPages || 1)
      } else {
        setItems([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (err) {
      console.warn('Items fetch error:', err.message)
      setApiError(err.message || 'Failed to load grocery items from server.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedStatus, currentPage])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Open Add Item Modal
  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      packSize: '',
      unit: 'KG',
      category: selectedCategory !== 'All Categories' ? selectedCategory : 'Pulses, Dals & Legumes',
      specifications: '',
      referencePrice: '',
      status: 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Open Edit Item Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      packSize: item.packSize || '',
      unit: item.unit || 'KG',
      category: item.category || 'Pulses, Dals & Legumes',
      specifications: item.specifications || '',
      referencePrice: item.referencePrice || '',
      status: item.status || 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Delete Item with SweetAlert
  const handleDeleteItem = async (id, itemName) => {
    const isConfirmed = await confirmDelete({
      title: `Delete "${itemName}"?`,
      text: 'Are you sure you want to delete this grocery item from Item Master? It will no longer appear in new demand creations.'
    })
    if (!isConfirmed) return
    try {
      await itemService.deleteItem(id)
      triggerToast(`Item "${itemName}" removed from master inventory`)
      fetchItems()
    } catch (err) {
      alert(err.message || 'Failed to delete item')
    }
  }

  // Toggle Item Status (Active <-> Inactive) with SweetAlert
  const handleToggleItemStatus = async (item) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active'
    const isConfirmed = await confirmStatusToggle({
      itemName: item.name,
      newStatus
    })
    if (!isConfirmed) return

    try {
      await itemService.updateItem(item._id, {
        name: item.name,
        unit: item.unit,
        category: item.category,
        packSize: item.packSize,
        referencePrice: item.referencePrice,
        status: newStatus
      })
      triggerToast(`"${item.name}" marked as ${newStatus}`)
      fetchItems()
    } catch (err) {
      alert(err.message || 'Failed to update item status')
    }
  }

  // Add / Edit form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Please enter grocery item name.')
      return
    }

    setIsSubmitting(true)
    try {
      let finalName = formData.name.trim()
      const pack = formData.packSize.trim()
      if (pack && !finalName.toLowerCase().includes(pack.toLowerCase())) {
        finalName = `${finalName} (${pack})`
      }

      const payload = {
        name: finalName,
        packSize: pack,
        unit: formData.unit,
        category: formData.category,
        specifications: formData.specifications.trim(),
        referencePrice: Number(formData.referencePrice) || 0,
        status: formData.status
      }

      if (editingItem) {
        await itemService.updateItem(editingItem._id, payload)
        triggerToast(`Item "${finalName}" updated successfully in MongoDB!`)
      } else {
        await itemService.createItem(payload)
        triggerToast(`Item "${finalName}" added to master inventory!`)
      }

      setIsModalOpen(false)
      fetchItems()
    } catch (err) {
      setFormError(err.message || 'Operation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================================
  // Download Sample Excel (.xlsx) Formatted EXACTLY like Grocery_Master_Inventory-4 (1).xlsx
  // =========================================================================
  const handleDownloadSampleExcel = () => {
    try {
      const wb = XLSX.utils.book_new()
      const wsData = [
        [
          'S. No.',
          'Item Name',
          'Packaging Type / Pack Size',
          'Quantity in Stock (Qty)',
          'Essential Specifications & Quality Standards',
          'Rates per Pack (₹)',
          'Total Cost as per Quantity (₹)'
        ],
        ['PULSES, DALS & LEGUMES (दालें एवं दलहन)'],
        [1, 'Toor Dal / Arhar Dal', '1 kg pack', 0, 'Unpolished, 98-100% purity, zero artificial color, moisture <12%', 145, 0],
        [2, 'Toor Dal / Arhar Dal', '5 kg pack', 0, 'Unpolished, heavy plastic pouch, moisture <12%', 710, 0],
        [3, 'Toor Dal / Arhar Dal', '30 kg bag', 0, 'Unpolished, wholesale grade A, woven PP bag packing', 4200, 0],
        [4, 'Moong Dal Dhuli (Yellow)', '1 kg pack', 0, 'Unpolished, uniform grain size, moisture <11%', 115, 0],
        ['ATTA, FLOURS & GRAINS (आटा, सूजी एवं अनाज)'],
        [5, 'Sharbati Wheat Atta (100% MP Whole Wheat)', '10 kg bag', 0, 'Zero maida, high bran fiber content', 380, 0],
        [6, 'Maida (All Purpose Flour)', '1 kg pack', 0, 'Fine milled, free flowing, zero lumps', 42, 0],
        ['EDIBLE OILS & GHEE (खाद्य तेल एवं घी)'],
        [7, 'Refined Sunflower Oil', '1 L pouch', 0, 'Agmark grade I, enriched with vitamins A & D', 125, 0],
        [8, 'Desi Cow Ghee (Danedar)', '1 L carton', 0, 'Pure cow milk fat, authentic granular texture', 620, 0],
        ['SPICES - WHOLE & GROUND (मसाले - खड़े एवं पिसे)'],
        [9, 'Turmeric Powder (Haldi)', '500 gm pack', 0, 'Min 3% curcumin content, zero artificial lead chromate', 95, 0],
        [10, 'Jeera / Cumin Seeds (Whole)', '1 kg pack', 0, 'Machine cleaned 99.5% purity, bold seeds', 380, 0]
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = [
        { wch: 8 },  // S. No.
        { wch: 38 }, // Item Name
        { wch: 25 }, // Packaging Type / Pack Size
        { wch: 15 }, // Qty
        { wch: 55 }, // Specifications
        { wch: 18 }, // Rates per Pack
        { wch: 20 }  // Total Cost
      ]
      XLSX.utils.book_append_sheet(wb, ws, 'Grocery Inventory List')
      XLSX.writeFile(wb, 'Grocery_Master_Inventory_Template.xlsx')
      triggerToast('Sample Excel template downloaded (.xlsx)!')
    } catch (err) {
      console.error('Excel template download error:', err)
      triggerToast('Download error: ' + err.message)
    }
  }

  // =========================================================================
  // Robust Excel (.xlsx, .xls) and CSV Parser for Grocery Inventory
  // =========================================================================
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    setImportError('')
    if (!file) return

    setImportFileName(file.name)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      if (!rawRows || rawRows.length < 2) {
        setImportError('Uploaded file is empty or does not contain data rows.')
        return
      }

      let currentCategory = 'General Grocery'
      const items = []

      // Check header row keywords
      const headerRow = (rawRows[0] || []).map((h) => String(h || '').trim().toLowerCase())
      const hasSno = headerRow.some((h) => h.includes('s. no') || h.includes('sno') || h.includes('sr'))
      const hasPackSize = headerRow.some((h) => h.includes('packaging') || h.includes('pack size'))

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i]
        if (!row || row.length === 0) continue

        // Check if this row is a Section Category Header: e.g. ['PULSES, DALS & LEGUMES (दालें एवं दलहन)']
        if (
          typeof row[0] === 'string' &&
          isNaN(Number(row[0])) &&
          (row[1] === undefined || row[1] === null || String(row[1]).trim() === '')
        ) {
          const catClean = String(row[0])
            .replace(/\(.*?\)/g, '')
            .trim()
          if (catClean) currentCategory = catClean
          continue
        }

        let itemName = ''
        let packSize = ''
        let specs = ''
        let rate = 0
        let unit = 'KG'
        let category = currentCategory

        if (hasPackSize || hasSno) {
          // Client Excel Format: Col 0: S.No, Col 1: Item Name, Col 2: Pack Size, Col 3: Qty, Col 4: Specs, Col 5: Rate
          if (isNaN(Number(row[0])) && !row[1]) continue
          itemName = String(row[1] || row[0] || '').trim()
          packSize = String(row[2] || '').trim()
          specs = String(row[4] || '').trim()
          rate = Number(row[5]) || 0
        } else {
          // Standard Tabular Format: Item Name, Unit, Category, Reference Price, Status
          itemName = String(row[0] || '').trim()
          unit = String(row[1] || 'KG').trim()
          if (row[2]) category = String(row[2]).trim()
          rate = Number(row[3]) || 0
        }

        if (!itemName) continue

        // Derive unit from packSize if not given
        if (!unit || unit === 'KG') {
          const lowerPack = packSize.toLowerCase()
          if (lowerPack.includes('kg')) unit = 'KG'
          else if (lowerPack.includes('gm') || lowerPack.includes('gram')) unit = 'Gram'
          else if (lowerPack.includes('l') || lowerPack.includes('litre') || lowerPack.includes('ml')) unit = 'Litre'
          else if (lowerPack.includes('pack')) unit = 'Packet'
          else if (lowerPack.includes('bag')) unit = 'Bag'
          else if (lowerPack.includes('tin')) unit = 'Tin'
          else if (lowerPack.includes('jar')) unit = 'Jar'
          else if (lowerPack.includes('bar')) unit = 'Piece'
        }

        const fullName = packSize && !itemName.toLowerCase().includes(packSize.toLowerCase())
          ? `${itemName} (${packSize})`
          : itemName

        items.push({
          name: fullName,
          rawName: itemName,
          packSize,
          category,
          specifications: specs,
          unit,
          referencePrice: rate,
          status: 'Active'
        })
      }

      if (items.length === 0) {
        setImportError('No valid grocery items detected. Please check file structure or download the sample template.')
      } else {
        setParsedRows(items)
      }
    } catch (err) {
      setImportError('Failed to parse Excel/CSV file: ' + err.message)
    }
  }

  // Execute Bulk Import to MongoDB
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return
    setIsImporting(true)
    try {
      const res = await itemService.bulkImport(parsedRows)
      setIsImportModalOpen(false)
      setParsedRows([])
      setImportFileName('')
      triggerToast(res.message || `Successfully imported ${parsedRows.length} grocery items into MongoDB!`)
      fetchItems()
    } catch (err) {
      setImportError(err.message || 'Import failed.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0e743d] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-400/30 animate-in slide-in-from-top-3 duration-200">
          <IconCheck className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer p-0.5 rounded"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backend API Connection Warning */}
      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <IconAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Backend Connection Notice</p>
              <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchItems}
            className="px-3 py-1 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg text-xs font-bold text-amber-900 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Controls: Search Input, Category Filter & Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search grocery item by name or pack size..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            {OFFICIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

        </div>

        {/* Action Buttons: Sample Template, Import Excel & Add Item */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          
          {/* Download Sample Excel (.xlsx) Template Button */}
          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
            title="Download formatted sample Excel sheet (.xlsx)"
          >
            <IconExcel className="w-4 h-4 text-emerald-700" />
            <span>Sample Excel</span>
          </button>

          {/* Import Excel / CSV Button */}
          <button
            type="button"
            onClick={() => {
              setParsedRows([])
              setImportFileName('')
              setImportError('')
              setIsImportModalOpen(true)
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#0e743d] border border-emerald-400 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
            title="Import inventory from Excel or CSV file"
          >
            <IconUpload className="w-4 h-4 text-[#0e743d]" />
            <span>Import Excel</span>
          </button>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
          >
            <span className="text-lg leading-none font-bold">+</span>
            <span>Add Item</span>
          </button>

        </div>

      </div>

      {/* Items Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-800 text-[13px] font-bold bg-slate-50/70">
                <th className="py-4 px-6 w-14">#</th>
                <th className="py-4 px-6">Grocery Item Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6 text-center">Unit</th>
                <th className="py-4 px-6 text-center">Ref. Rate</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-0">
                    <TableSkeleton rows={6} cols={7} />
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item, index) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-4 px-6 font-medium text-slate-400 text-xs">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* Item Name & Specs */}
                    <td className="py-4 px-6 max-w-md">
                      <p className="font-bold text-slate-900 group-hover:text-[#0e743d] transition-colors leading-snug">
                        {item.name}
                      </p>
                      {item.specifications && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate" title={item.specifications}>
                          {item.specifications}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                        {item.category || 'Grocery'}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                        {item.unit}
                      </span>
                    </td>

                    {/* Reference Rate */}
                    <td className="py-4 px-6 text-center font-mono text-xs text-slate-700 font-semibold">
                      {item.referencePrice ? `₹${item.referencePrice}` : '—'}
                    </td>

                    {/* Status Badge with SweetAlert Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(item)}
                        title={`Click to switch status to ${item.status === 'Active' ? 'Inactive' : 'Active'}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105 ${
                          item.status === 'Active'
                            ? 'bg-[#eaf8f0] text-[#0e743d] hover:bg-rose-50 hover:text-rose-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-[#0e743d] border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-[#1bb062]' : 'bg-[#ef4444]'}`} />
                        <span>{item.status || 'Active'}</span>
                      </button>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <IconEdit className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Clean Empty State */
                <tr>
                  <td colSpan="7" className="py-16 px-6 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center">
                        <IconSprout className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">
                        {searchQuery ? `No grocery items found matching "${searchQuery}"` : 'No Grocery Items Found'}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {searchQuery
                          ? 'Try searching with a different item keyword or change category filter.'
                          : 'You can import your Excel file or click "Add Item" to register items.'}
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setParsedRows([])
                            setImportFileName('')
                            setImportError('')
                            setIsImportModalOpen(true)
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0e743d] border border-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          <IconUpload className="w-3.5 h-3.5" />
                          <span>Import Excel</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="px-4 py-2 bg-[#0e743d] hover:bg-[#0a6032] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          + Add Item
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Real Table Footer with Database Pagination */}
        <div className="py-4 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 bg-slate-50/50">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800">
              {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>
            -
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * itemsPerPage, totalCount)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{totalCount}</span> grocery items in database
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1]
                    const showEllipsis = prevPage && page - prevPage > 1
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer ${
                            currentPage === page
                              ? 'bg-[#0e743d] text-white shadow-sm'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    )
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT ITEM MODAL (Mounted on document.body with createPortal)        */}
      {/* ========================================================================= */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Grocery Item' : 'Add New Grocery Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Item Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Toor Dal / Arhar Dal"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>

                {/* Packaging Size & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Packaging / Pack Size
                    </label>
                    <input
                      type="text"
                      value={formData.packSize}
                      onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                      placeholder="e.g. 1 kg pack or 30 kg bag"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      {OFFICIAL_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unit of Measurement & Reference Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Unit of Measure <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Reference Rate (₹ per pack)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.referencePrice}
                      onChange={(e) => setFormData({ ...formData, referencePrice: e.target.value })}
                      placeholder="e.g. 145"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Quality Specifications & Standards
                  </label>
                  <textarea
                    rows="2"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="e.g. Unpolished, 98-100% purity, zero artificial color"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 resize-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Item Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Active">Active (Available for Demands)</option>
                    <option value="Inactive">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* IMPORT EXCEL (.xlsx / .csv) MODAL (Mounted on document.body with createPortal) */}
      {/* ========================================================================= */}
      {isImportModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsImportModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Import Grocery Inventory from Excel (.xlsx / .csv)
                </h3>
                <p className="text-xs text-slate-500">
                  Upload your master inventory list to sync with MongoDB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Template Download Banner */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-950">Official Master Inventory Template</p>
                  <p className="text-[11px] text-emerald-800">
                    Download sample Excel workbook matching your store categories
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-[#0e743d] border border-emerald-300 rounded-xl hover:bg-emerald-100/70 transition-all cursor-pointer shadow-2xs"
                >
                  <IconDownload className="w-3.5 h-3.5" />
                  <span>Download Sample (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0e743d] flex items-center justify-center mx-auto mb-3">
                  <IconUpload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {importFileName ? importFileName : 'Select Grocery Excel or CSV file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-input"
                />
                
                <label
                  htmlFor="excel-file-input"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0e743d] border border-emerald-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  {importFileName ? 'Choose Another File' : 'Browse File'}
                </label>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <IconAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Rows Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Preview: <strong className="text-[#0e743d]">{parsedRows.length} grocery items</strong> detected
                    </span>
                    <span className="text-emerald-700 font-semibold">Valid Format ✓</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                        <tr>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3">Pack Size</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3 text-right">Ref. Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{row.name}</td>
                            <td className="py-1.5 px-3 text-slate-600">{row.packSize || row.unit}</td>
                            <td className="py-1.5 px-3 text-slate-500">{row.category}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-700">
                              {row.referencePrice ? `₹${row.referencePrice}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 20 && (
                    <p className="text-[11px] text-slate-400 text-right">
                      ...and {parsedRows.length - 20} more items will be imported into MongoDB
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || parsedRows.length === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing to MongoDB...</span>
                  </>
                ) : (
                  <span>Confirm & Import ({parsedRows.length} Items)</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
