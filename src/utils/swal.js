import Swal from 'sweetalert2'

// Custom Styled SweetAlert2 Instance matching Mirch Masala Theme
export const AppSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-3xl p-6 font-sans shadow-2xl border border-slate-100',
    title: 'text-xl font-extrabold text-slate-900 tracking-tight',
    htmlContainer: 'text-sm text-slate-500 leading-relaxed mt-2',
    confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md mx-1.5 transition-all duration-150 cursor-pointer',
    cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 mx-1.5 transition-all duration-150 cursor-pointer',
    actions: 'gap-2 mt-4'
  },
  buttonsStyling: false
})

/**
 * SweetAlert Confirm for Delete Operations
 */
export const confirmDelete = async ({
  title = 'Delete Item?',
  text = 'This action cannot be undone. Are you sure you want to proceed?',
  confirmButtonText = 'Yes, Delete It',
  cancelButtonText = 'Cancel'
} = {}) => {
  const result = await AppSwal.fire({
    title,
    text,
    icon: 'warning',
    iconColor: '#e11d48',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 mx-1.5 transition-all duration-150 cursor-pointer',
      cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 mx-1.5 transition-all duration-150 cursor-pointer'
    }
  })
  return result.isConfirmed
}

/**
 * SweetAlert Confirm for Status Toggle (Active / Inactive)
 */
export const confirmStatusToggle = async ({
  itemName = 'Item',
  newStatus = 'Inactive',
  title,
  text
} = {}) => {
  const isActivating = newStatus === 'Active'
  const finalTitle = title || (isActivating ? `Activate ${itemName}?` : `Deactivate ${itemName}?`)
  const finalText = text || (isActivating
    ? `Are you sure you want to activate "${itemName}"? It will become visible and active for bidding.`
    : `Are you sure you want to deactivate "${itemName}"? It will be marked as Inactive.`)

  const result = await AppSwal.fire({
    title: finalTitle,
    text: finalText,
    icon: isActivating ? 'question' : 'warning',
    iconColor: isActivating ? '#0e743d' : '#f59e0b',
    showCancelButton: true,
    confirmButtonText: isActivating ? 'Yes, Activate' : 'Yes, Deactivate',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: isActivating
        ? 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#0e743d] hover:bg-[#0a6032] shadow-md shadow-emerald-800/20 mx-1.5 transition-all duration-150 cursor-pointer'
        : 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 mx-1.5 transition-all duration-150 cursor-pointer',
      cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 mx-1.5 transition-all duration-150 cursor-pointer'
    }
  })
  return result.isConfirmed
}

/**
 * SweetAlert Confirm for Logout
 */
export const confirmLogout = async () => {
  const result = await AppSwal.fire({
    title: 'Logout of Admin Panel?',
    text: 'You will need to re-enter your credentials to access the admin portal.',
    icon: 'question',
    iconColor: '#0e743d',
    showCancelButton: true,
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Stay Logged In',
    customClass: {
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 mx-1.5 transition-all duration-150 cursor-pointer',
      cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 mx-1.5 transition-all duration-150 cursor-pointer'
    }
  })
  return result.isConfirmed
}

/**
 * SweetAlert Confirm for Generic Admin Actions (e.g. Approve Order, Early Close Bidding)
 */
export const confirmGenericAction = async ({
  title,
  text,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  isDanger = false
}) => {
  const result = await AppSwal.fire({
    title,
    text,
    icon: isDanger ? 'warning' : 'question',
    iconColor: isDanger ? '#e11d48' : '#0e743d',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      confirmButton: isDanger
        ? 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 mx-1.5 transition-all duration-150 cursor-pointer'
        : 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#0e743d] hover:bg-[#0a6032] shadow-md shadow-emerald-800/20 mx-1.5 transition-all duration-150 cursor-pointer',
      cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 mx-1.5 transition-all duration-150 cursor-pointer'
    }
  })
  return result.isConfirmed
}

/**
 * Success Alert
 */
export const showSuccessAlert = (title, text = '') => {
  return AppSwal.fire({
    icon: 'success',
    title,
    text,
    iconColor: '#0e743d',
    confirmButtonText: 'Great!',
    customClass: {
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#0e743d] hover:bg-[#0a6032] shadow-md shadow-emerald-800/20 mx-1.5 transition-all duration-150 cursor-pointer'
    }
  })
}

/**
 * Error Alert
 */
export const showErrorAlert = (title, text = '') => {
  return AppSwal.fire({
    icon: 'error',
    title,
    text,
    iconColor: '#e11d48',
    confirmButtonText: 'OK',
    customClass: {
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 mx-1.5 transition-all duration-150 cursor-pointer'
    }
  })
}
