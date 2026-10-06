import SarvaMark from './SarvaMark';

export function AppLoader({ message = 'Preparing your hostel...' }) {
  return (
    <div className="sarva-boot" role="status" aria-live="polite" aria-label={message}>
      <div className="sarva-boot__glow" aria-hidden="true" />
      <div className="sarva-boot__content">
        <div className="sarva-boot__mark" aria-hidden="true"><span className="sarva-boot__ring sarva-boot__ring--outer" /><span className="sarva-boot__ring sarva-boot__ring--inner" /><div className="sarva-boot__logo"><SarvaMark /></div></div>
        <div className="sarva-boot__brand">SARVA <span>Hostel</span></div>
        <p className="sarva-boot__tagline">Hostel Management System</p>
        <div className="sarva-boot__bar" aria-hidden="true"><span /></div>
        <p className="sarva-boot__message">{message}</p>
        <div className="sarva-boot__dots" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div
      className="sarva-dashboard-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <div className="sarva-dashboard-skeleton__hero">
        <div>
          <div className="sarva-skeleton-line sarva-skeleton-line--eyebrow" />
          <div className="sarva-skeleton-line sarva-skeleton-line--title" />
          <div className="sarva-skeleton-line sarva-skeleton-line--subtitle" />
        </div>

        <div className="sarva-skeleton-block sarva-skeleton-block--hero" />
      </div>

      <div className="sarva-dashboard-skeleton__kpis">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="sarva-dashboard-skeleton__card"
            key={index}
          >
            <div className="sarva-skeleton-block sarva-skeleton-block--icon" />
            <div className="sarva-skeleton-line sarva-skeleton-line--label" />
            <div className="sarva-skeleton-line sarva-skeleton-line--value" />
            <div className="sarva-skeleton-line sarva-skeleton-line--small" />
          </div>
        ))}
      </div>

      <div className="sarva-dashboard-skeleton__content">
        <div className="sarva-dashboard-skeleton__panel">
          <div className="sarva-skeleton-line sarva-skeleton-line--heading" />
          <div className="sarva-skeleton-block sarva-skeleton-block--chart" />
        </div>

        <div className="sarva-dashboard-skeleton__panel">
          <div className="sarva-skeleton-line sarva-skeleton-line--heading" />

          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="sarva-dashboard-skeleton__row"
              key={index}
            >
              <div className="sarva-skeleton-block sarva-skeleton-block--row-icon" />

              <div>
                <div className="sarva-skeleton-line sarva-skeleton-line--row" />
                <div className="sarva-skeleton-line sarva-skeleton-line--small" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">
        Loading dashboard information...
      </span>
    </div>
  );
}

export default AppLoader;
