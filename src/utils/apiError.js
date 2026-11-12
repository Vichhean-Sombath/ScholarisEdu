export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  const responseData = error?.response?.data
  const errors = responseData?.errors

  if (Array.isArray(errors)) {
    const messages = errors.filter((message) => typeof message === 'string' && message.trim())
    if (messages.length > 0) return messages.join(' ')
  }

  if (typeof errors === 'string' && errors.trim()) return errors
  if (typeof responseData?.message === 'string' && responseData.message.trim()) return responseData.message
  if (typeof error?.message === 'string' && error.message.trim()) return error.message

  return fallback
}
