import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { itemService, demandService } from '../../services/api'
import { TableSkeleton } from '../../components/common/Skeleton'

export default function CreateDemand({ onBack, onDemandCreated }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [newItemData, setNewItemData] = useState({ name: '', unit: 'KG', quantity: '10', saveToMaster: false })
  const [rowsToAddCount, setRowsToAddCount] = useState(40)
  const [durationHours, setDurationHours] = useState(48)
  const [loadingItems, setLoadingItems] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Demand items list
  const [items, setItems] = useState([])

  // Load items from Item Master catalog on mount
  useEffect(() => {
    loadMasterItems()
  }, [])

  const loadMasterItems = async () => {
    try {
      setLoadingItems(true)
      const res = await itemService.getItems({ all: true })
      const masterItems = res.data || []

      // If items exist in master catalog, list them ready to be selected
      const initialItems = masterItems.map((item, idx) => ({
        id: `master-${item._id || idx}`,
        itemId: item._id,
        name: item.name,
        unit: item.unit || 'KG',
        quantity: '',
        selected: false,
        isCustom: false
      }))

      setItems(initialItems)
    } catch (err) {
      console.error('Failed to load master items:', err)
      setItems([])
    } finally {
      setLoadingItems(false)
    }
  }

  // Toggle single item selection
  const handleToggleSelect = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    )
  }

  // Toggle all items in current view
  const allFilteredSelected =
    items.length > 0 && items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.isCustom).every((i) => i.selected)

  const handleToggleSelectAll = () => {
    const nextState = !allFilteredSelected
    setItems((prev) =>
      prev.map((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.isCustom
        return matchesSearch ? { ...item, selected: nextState } : item
      })
    )
  }

  // Change quantity
  const handleQuantityChange = (id, val) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: val } : item
      )
    )
  }

  // Change custom item name
  const handleCustomNameChange = (id, val) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: val } : item
      )
    )
  }

  // Change custom item unit
  const handleCustomUnitChange = (id, val) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unit: val } : item
      )
    )
  }

  // Add blank rows directly (workflow feature: +10, 20, 40, 50 blank rows)
  const handleAddBlankRows = (count = 40) => {
    const newBlankRows = []
    const timestamp = Date.now()
    for (let i = 0; i < count; i++) {
      newBlankRows.push({
        id: `custom-${timestamp}-${i}`,
        itemId: null,
        name: '',
        unit: 'KG',
        quantity: '',
        selected: true,
        isCustom: true
      })
    }
    setItems((prev) => [...prev, ...newBlankRows])
  }

  // Remove a row from demand
  const handleRemoveRow = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Add single new item via modal
  const handleAddNewItem = async (e) => {
    e.preventDefault()
    if (!newItemData.name.trim()) return

    let createdItemId = null
    if (newItemData.saveToMaster) {
      try {
        const created = await itemService.createItem({
          name: newItemData.name.trim(),
          unit: newItemData.unit,
          category: 'Others',
          status: 'Active'
        })
        if (created?._id) {
          createdItemId = created._id
        }
      } catch (err) {
        console.warn('Could not save to master catalog:', err.message)
      }
    }

    const newItem = {
      id: `new-${Date.now()}`,
      itemId: createdItemId,
      name: newItemData.name.trim(),
      unit: newItemData.unit,
      quantity: newItemData.quantity || '10',
      selected: true,
      isCustom: false
    }

    setItems((prev) => [newItem, ...prev])
    setIsAddItemModalOpen(false)
    setNewItemData({ name: '', unit: 'KG', quantity: '10', saveToMaster: false })
  }

  // Filter items by search
  const filteredItems = items.filter(
    (item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.isCustom
  )

  const selectedItems = items.filter(
    (item) => item.selected && item.name.trim() !== ''
  )

  // Step Validation & Navigation
  const handleNextStep = () => {
    setErrorMessage('')

    if (currentStep === 1) {
      if (selectedItems.length === 0) {
        setErrorMessage('Please select or add at least one item with a name to continue.')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const itemsWithoutQty = selectedItems.filter(
        (i) => !i.quantity || Number(i.quantity) <= 0
      )
      if (itemsWithoutQty.length > 0) {
        setErrorMessage(
          `Please enter a valid quantity (> 0) for "${itemsWithoutQty[0].name || 'unnamed item'}".`
        )
        return
      }
      setCurrentStep(3)
    }
  }

  // Publish Demand API Call
  const handlePublishDemand = async () => {
    setErrorMessage('')
    if (selectedItems.length === 0) {
      setErrorMessage('Cannot publish empty demand. Please select items.')
      return
    }

    const unquantified = selectedItems.find((i) => !i.quantity || Number(i.quantity) <= 0)
    if (unquantified) {
      setErrorMessage(`Please enter quantity for ${unquantified.name}`)
      return
    }

    try {
      setPublishing(true)
      const payload = {
        durationHours: Number(durationHours) || 48,
        items: selectedItems.map((item) => ({
          itemId: item.itemId || null,
          name: item.name.trim(),
          unit: item.unit || 'KG',
          quantity: Number(item.quantity)
        }))
      }

      const res = await demandService.createDemand(payload)
      if (res.success && res.data) {
        if (onDemandCreated) {
          onDemandCreated(res.data)
        }
      } else {
        setErrorMessage(res.message || 'Failed to publish demand')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Server error while publishing demand')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* 3-Step Stepper Progress Bar */}
      <div className="flex items-center justify-start sm:justify-center pt-1 pb-3 select-none overflow-x-auto w-full">
        <div className="flex items-center gap-1.5 sm:gap-4 text-xs sm:text-sm shrink-0">
          
          {/* Step 1: Select Items */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              currentStep === 1 ? 'font-bold text-[#0e743d]' : 'font-medium text-slate-500'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 1 ? 'bg-[#0e743d] text-white shadow-sm' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span>Select Items</span>
          </button>

          {/* Divider Line */}
          <div className="w-10 sm:w-16 h-[1.5px] bg-slate-200" />

          {/* Step 2: Set Quantity */}
          <button
            type="button"
            onClick={() => {
              if (selectedItems.length > 0) setCurrentStep(2)
            }}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              currentStep === 2 ? 'font-bold text-[#0e743d]' : 'font-medium text-slate-500'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 2 ? 'bg-[#0e743d] text-white shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              2
            </span>
            <span>Set Quantity</span>
          </button>

          {/* Divider Line */}
          <div className="w-10 sm:w-16 h-[1.5px] bg-slate-200" />

          {/* Step 3: Review & Publish */}
          <button
            type="button"
            onClick={() => {
              if (selectedItems.length > 0 && selectedItems.every((i) => Number(i.quantity) > 0)) {
                setCurrentStep(3)
              }
            }}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              currentStep === 3 ? 'font-bold text-[#0e743d]' : 'font-medium text-slate-500'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3 ? 'bg-[#0e743d] text-white shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              3
            </span>
            <span>Review & Publish</span>
          </button>

        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 1 & 2: Items Table View */}
      {currentStep <= 2 && (
        <>
          {/* Top Controls: Search Input & Action Buttons */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item to add..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all"
              />
            </div>

            {/* Action Buttons: Add Blank Rows (Workflow feature) & Add New Item */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              
              {/* + Add 40-50 Blank Rows Button (Directly from Workflow) */}
              <div className="inline-flex rounded-xl shadow-sm border border-emerald-300 bg-emerald-50/70 p-0.5">
                <button
                  type="button"
                  onClick={() => handleAddBlankRows(rowsToAddCount)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0e743d] hover:bg-emerald-100/70 rounded-lg transition-colors cursor-pointer"
                  title="Add empty rows directly for quick typing on the fly"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>+ Add {rowsToAddCount} Blank Rows</span>
                </button>
                <select
                  value={rowsToAddCount}
                  onChange={(e) => setRowsToAddCount(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-[#0e743d] border-l border-emerald-300/80 px-2 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Add New Item Modal Button */}
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
              >
                <span className="text-lg leading-none font-bold">+</span>
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Demand Items Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-800 text-[13.5px] font-bold">
                    <th className="py-4 px-6 w-14">
                      {/* Select All Checkbox */}
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-emerald-800 bg-white border-slate-300 focus:ring-emerald-700 accent-[#0e743d] cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-6">Item Name</th>
                    <th className="py-4 px-6 w-36">Unit</th>
                    <th className="py-4 px-6 w-48">Demand Quantity</th>
                    <th className="py-4 px-4 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loadingItems ? (
                    <tr>
                      <td colSpan="5" className="p-0">
                        <TableSkeleton rows={5} cols={5} />
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          item.selected ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4 h-4 rounded text-emerald-800 bg-white border-slate-300 focus:ring-emerald-700 accent-[#0e743d] cursor-pointer"
                          />
                        </td>

                        {/* Item Name (Editable if Blank Row added) */}
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {item.isCustom ? (
                            <input
                              type="text"
                              placeholder={`Enter item name #${idx + 1}...`}
                              value={item.name}
                              onChange={(e) => handleCustomNameChange(item.id, e.target.value)}
                              className="w-full max-w-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 placeholder-slate-400"
                            />
                          ) : (
                            item.name
                          )}
                        </td>

                        {/* Unit (Selectable if Blank Row) */}
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {item.isCustom ? (
                            <select
                              value={item.unit}
                              onChange={(e) => handleCustomUnitChange(item.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                            >
                              <option value="KG">KG</option>
                              <option value="Litre">Litre</option>
                              <option value="Gram">Gram</option>
                              <option value="Packet">Packet</option>
                              <option value="Piece">Piece</option>
                              <option value="Box">Box</option>
                              <option value="Quintal">Quintal</option>
                            </select>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                              {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Demand Quantity Input Box */}
                        <td className="py-3 px-6">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            disabled={!item.selected}
                            className={`w-36 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                              item.selected
                                ? 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10'
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                        </td>

                        {/* Remove Row Action */}
                        <td className="py-3 px-4 text-center">
                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Delete row"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0e743d] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-slate-800">
                            {searchQuery ? `No items found matching "${searchQuery}"` : 'No items in the list yet'}
                          </p>
                          <p className="text-xs text-slate-400">
                            Click "+ Add 40 Blank Rows" or "+ Add Item" above to add grocery items to your demand.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddBlankRows(40)}
                            className="px-4 py-2 bg-[#0e743d] hover:bg-[#0a6032] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                          >
                            + Add 40 Blank Rows Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected items count footer */}
            <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                <strong>{selectedItems.length}</strong> of {items.length} items selected
              </span>
              <span className="font-medium text-emerald-800">
                Step {currentStep} of 3
              </span>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Review & Publish View */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Review Demand Summary</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify the selected items and quantities before broadcasting to registered vendors for live competitive bidding.
              </p>
            </div>
            
            {/* Live window selector */}
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Bidding Window:</span>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="bg-white border border-slate-200 text-xs font-bold text-[#0e743d] rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours (Standard)</option>
                <option value={72}>72 Hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {selectedItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:border-emerald-200 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {idx + 1}. {item.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Unit: {item.unit}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-[#0e743d] font-bold text-sm rounded-lg">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#0e743d] shrink-0 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span>
              Publishing this demand will start the <strong>{durationHours}-Hour Live Countdown</strong> and make it immediately available for all registered vendors to quote their lowest wholesale rates.
            </span>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons (Cancel & Next) */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1)
            } else if (onBack) {
              onBack()
            }
          }}
          className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          {currentStep === 1 ? 'Back to Demands' : 'Previous Step'}
        </button>

        <button
          type="button"
          disabled={publishing}
          onClick={currentStep < 3 ? handleNextStep : handlePublishDemand}
          className={`flex items-center gap-2 px-6 py-2.5 bg-[#0e743d] hover:bg-[#0a6032] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 cursor-pointer ${
            publishing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {publishing && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>
            {currentStep === 1
              ? `Next: Set Quantity (${selectedItems.length})`
              : currentStep === 2
              ? 'Next: Review & Publish'
              : `Publish Demand & Start ${durationHours}h Timer`}
          </span>
        </button>
      </div>

      {/* Add New Item Modal (Mounted via Portal, z-[9999], bg-black/65, zero blur) */}
      {isAddItemModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">Add Item to Demand</h3>
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddNewItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                    placeholder="e.g. Mustard Oil (Fortune 1L)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Unit
                    </label>
                    <select
                      value={newItemData.unit}
                      onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    >
                      <option value="KG">KG</option>
                      <option value="Litre">Litre</option>
                      <option value="Gram">Gram</option>
                      <option value="Packet">Packet</option>
                      <option value="Piece">Piece</option>
                      <option value="Box">Box</option>
                      <option value="Quintal">Quintal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Demand Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newItemData.quantity}
                      onChange={(e) => setNewItemData({ ...newItemData, quantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveToMaster"
                    checked={newItemData.saveToMaster}
                    onChange={(e) => setNewItemData({ ...newItemData, saveToMaster: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-800 bg-white border-slate-300 focus:ring-emerald-700 accent-[#0e743d] cursor-pointer"
                  />
                  <label htmlFor="saveToMaster" className="text-xs text-slate-600 cursor-pointer">
                    Also save to Item Master catalog for future demands
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0e743d] hover:bg-[#0a6032] rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Add to Demand
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

    </div>
  )
}
