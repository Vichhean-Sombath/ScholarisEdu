import Swal from 'sweetalert2'

const PRIMARY = '#1e3a5f'
const SUCCESS = '#16a34a'
const ERROR = '#dc2626'

const baseConfig = {
  color: '#1e293b',
  confirmButtonColor: PRIMARY,
  cancelButtonColor: '#6b7280',
}

const Toast = Swal.mixin({
  ...baseConfig,
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

export const toastSuccess = (title) => Toast.fire({ icon: 'success', title })

export const toastError = (title) => Toast.fire({ icon: 'error', title })

export const showSuccess = (title, text) =>
  Swal.fire({ ...baseConfig, icon: 'success', title, text })

export const showError = (title, text) =>
  Swal.fire({ ...baseConfig, icon: 'error', title, text })

export const confirmLogout = async () => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: 'question',
    title: 'Log out?',
    text: 'Are you sure you want to log out?',
    showCancelButton: true,
    confirmButtonText: 'Yes, log out',
    cancelButtonText: 'Cancel',
  })
  return result.isConfirmed
}

export const confirmDelete = async (itemName) => {
  const result = await Swal.fire({
    ...baseConfig,
    icon: 'warning',
    title: 'Are you sure?',
    text: `Are you sure you want to delete this ${itemName}?`,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: ERROR,
  })
  return result.isConfirmed
}
