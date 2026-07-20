import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getStudentGrades } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  KpiCard,
  ChartPanel,
  TablePanel,
  DataTable,
  EmptyState,
  paletteColorFor,
  formatShortDate,
  Icon,
} from './studentUtils'

function gradeClass(grade) {
  const letter = String(grade || '').charAt(0).toUpperCase()
  if (letter === 'A') return 'pill present'
  if (letter === 'B') return 'pill partial'
  if (letter === 'C') return 'pill'
  if (letter === 'D') return 'pill absent'
  if (letter === 'F') return 'pill overdue'
  return 'pill'
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState({ assessmentGrades: [], finalGrades: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGrades = () => {
    setLoading(true)
    setError('')
    getStudentGrades()
      .then((data) => setGrades(data))
      .catch(() => setError('Could not load grades. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadGrades()
  }, [])

  const { assessmentGrades, finalGrades } = grades

  const averageScore = assessmentGrades.length > 0
    ? Number((assessmentGrades.reduce((sum, g) => sum + g.percentage, 0) / assessmentGrades.length).toFixed(1))
    : 0

  const averageFinalScore = finalGrades.length > 0
    ? Number((finalGrades.reduce((sum, fg) => sum + fg.finalScore, 0) / finalGrades.length).toFixed(2))
    : 0

  const gradeDistribution = [
    { name: 'A', value: finalGrades.filter((fg) => /^A/.test(fg.letterGrade)).length },
    { name: 'B', value: finalGrades.filter((fg) => /^B/.test(fg.letterGrade)).length },
    { name: 'C', value: finalGrades.filter((fg) => /^C/.test(fg.letterGrade)).length },
    { name: 'D', value: finalGrades.filter((fg) => /^D/.test(fg.letterGrade)).length },
    { name: 'F', value: finalGrades.filter((fg) => /^F/.test(fg.letterGrade)).length },
  ].filter((d) => d.value > 0)

  const scoresOverTime = [...assessmentGrades]
    .sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate))
    .map((g) => ({ name: g.assessmentName.slice(0, 12), percentage: g.percentage }))

  return (
    <div className="page-section">
      <PageHeader title="My Grades" subtitle="Assessment scores and final grades." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadGrades} />
      ) : (
        <>
          <div className="stats-grid">
            <KpiCard icon={Icon.teacher()} value={assessmentGrades.length} label="Assessments" color="#1e3a5f" />
            <KpiCard icon={Icon.teacher()} value={`${averageScore}%`} label="Avg. Score" color="#2c5282" />
            <KpiCard icon={Icon.teacher()} value={finalGrades.length} label="Final Grades" color="#4a90d9" />
            <KpiCard icon={Icon.teacher()} value={averageFinalScore} label="Avg. Final Score" color="#7ab8e8" />
          </div>

          <div className="dashboard-row">
            <ChartPanel
              title="Score Progress"
              empty={scoresOverTime.length === 0}
              emptyMessage="No published assessment grades."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoresOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {scoresOverTime.map((item, index) => (
                      <Cell key={`cell-progress-${index}`} fill={item.percentage >= 70 ? '#4a90d9' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel
              title="Final Grade Distribution"
              empty={gradeDistribution.length === 0}
              emptyMessage="No final grades recorded."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((_, index) => (
                      <Cell key={`cell-grade-${index}`} fill={paletteColorFor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <div className="dashboard-row" style={{ flexDirection: 'column' }}>
            <TablePanel title="Assessment Grades">
              <DataTable
                headers={['Assessment', 'Subject', 'Class', 'Score', 'Percentage', 'Date']}
                rows={assessmentGrades}
                emptyMessage="No published assessment grades."
                renderRow={(row) => (
                  <tr key={row.gradeId}>
                    <td>{row.assessmentName}</td>
                    <td>{row.subjectName}</td>
                    <td>{row.className}</td>
                    <td>{row.score} / {row.maxScore}</td>
                    <td>
                      <span className={row.percentage >= 70 ? 'text-success' : 'text-error'}>{row.percentage}%</span>
                    </td>
                    <td>{formatShortDate(row.assessmentDate)}</td>
                  </tr>
                )}
              />
            </TablePanel>
          </div>

          <div className="dashboard-row" style={{ flexDirection: 'column' }}>
            <TablePanel title="Final Grades">
              <DataTable
                headers={['Subject', 'Class', 'Semester', 'Score', 'Grade', 'GPA']}
                rows={finalGrades}
                emptyMessage="No final grades recorded."
                renderRow={(row) => (
                  <tr key={row.finalGradeId}>
                    <td>{row.subjectName}</td>
                    <td>{row.className}</td>
                    <td>{row.semesterName}</td>
                    <td>{row.finalScore}</td>
                    <td>
                      <span className={gradeClass(row.letterGrade)}>{row.letterGrade || '—'}</span>
                    </td>
                    <td>{row.gpaPoints ?? '—'}</td>
                  </tr>
                )}
              />
            </TablePanel>
          </div>
        </>
      )}
    </div>
  )
}
