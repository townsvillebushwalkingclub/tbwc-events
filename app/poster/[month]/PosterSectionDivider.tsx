interface PosterSectionDividerProps {
  label: string
}

export default function PosterSectionDivider({
  label,
}: PosterSectionDividerProps) {
  return (
    <div className="poster-section-divider" role="presentation">
      <span className="poster-section-divider-line" aria-hidden />
      <span className="poster-section-divider-icon" aria-hidden>
        🏔
      </span>
      <h2 className="poster-section-divider-text">{label}</h2>
      <span className="poster-section-divider-line" aria-hidden />
    </div>
  )
}
