export default function CertificateTemplate({
  studentName,
  certificateType,
  issueDate,
  schoolName = 'Scholaris School',
  signature = 'School Principal',
}) {
  return (
    <div
      id="certificate-preview"
      className="certificate-template"
      style={{
        width: '900px',
        minHeight: '600px',
        padding: '64px 72px',
        background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
        border: '16px solid var(--primary, #1e3a5f)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: '#1e293b',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          right: 24,
          bottom: 24,
          border: '2px solid rgba(30, 58, 95, 0.25)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--primary, #1e3a5f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          S
        </div>
        <h2
          style={{
            fontSize: '1.25rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--primary, #1e3a5f)',
            marginBottom: 4,
          }}
        >
          {schoolName}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Excellence in Education</p>
      </div>

      <h1
        style={{
          fontSize: '2.75rem',
          fontWeight: 400,
          color: 'var(--primary, #1e3a5f)',
          marginBottom: 24,
          letterSpacing: '0.04em',
        }}
      >
        Certificate of {certificateType || 'Completion'}
      </h1>

      <p style={{ fontSize: '1.1rem', marginBottom: 28, color: '#475569' }}>
        This certificate is proudly presented to
      </p>

      <h2
        style={{
          fontSize: '2.25rem',
          fontWeight: 600,
          color: '#b45309',
          marginBottom: 32,
          borderBottom: '2px solid #e2e8f0',
          display: 'inline-block',
          paddingBottom: 8,
        }}
      >
        {studentName || 'Student Name'}
      </h2>

      <p
        style={{
          fontSize: '1rem',
          lineHeight: 1.7,
          maxWidth: 640,
          margin: '0 auto 48px',
          color: '#475569',
        }}
      >
        In recognition of outstanding achievement, dedication, and successful completion
        of all requirements for this award.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 64,
          padding: '0 40px',
        }}
      >
        <div style={{ textAlign: 'center', minWidth: 180 }}>
          <p
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              borderBottom: '1px solid #1e293b',
              paddingBottom: 6,
              marginBottom: 6,
            }}
          >
            {issueDate || '—'}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Date of Issue
          </p>
        </div>

        <div style={{ textAlign: 'center', minWidth: 180 }}>
          <p
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              borderBottom: '1px solid #1e293b',
              paddingBottom: 6,
              marginBottom: 6,
            }}
          >
            {signature}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Authorized Signature
          </p>
        </div>
      </div>
    </div>
  )
}
