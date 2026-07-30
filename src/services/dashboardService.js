import api from './api'

export const getDashboardSummary = async (range = 'monthly') => {
  const { data } = await api.get('/dashboard/summary', { params: { range } })
  return data.data
}

export const getReportsSummary = async (filters = {}) => {
  const { data } = await api.get('/reports/summary', { params: filters })
  return data.data
}
