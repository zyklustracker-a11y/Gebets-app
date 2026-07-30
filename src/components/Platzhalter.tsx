/**
 * Vorläufiger Bildschirm. Die Ansichten aus dem Design-Entwurf entstehen in
 * Bauabschnitt 3; bis dahin hält dieser Platzhalter das Routing lauffähig.
 */
export function Platzhalter({ titel, hinweis }: { titel: string; hinweis: string }) {
  return (
    <main
      style={{
        width: '100%',
        maxWidth: 393,
        minHeight: '100vh',
        padding: '96px 30px 34px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>
        {titel}
      </h1>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{hinweis}</p>
    </main>
  );
}
