export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-stage">
        <div className="hero-window">
          <div className="hero-window-bar">
            <i /><i /><i />
            <span>video.mp4 → loop.gif</span>
          </div>
          <div className="hero-window-body">
            <div className="hero-film">
              <b /><b /><b /><b />
            </div>
            <div className="hero-play" />
          </div>
        </div>
        <div className="hero-photo photo-a">
          <span />
        </div>
        <div className="hero-photo photo-b">
          <span />
        </div>
        <div className="hero-pdf">
          <em />
          <em />
          <em />
        </div>
        <div className="hero-chip chip-mp4">MP4</div>
        <div className="hero-chip chip-gif">GIF</div>
        <div className="hero-chip chip-png">PNG</div>
        <div className="hero-chip chip-pdf">PDF</div>
      </div>
    </div>
  );
}

const categoryArt = {
  video: (
    <svg viewBox="0 0 88 64" fill="none">
      <rect x="8" y="12" width="48" height="36" rx="6" fill="#17252a" />
      <path d="M28 24v16l14-8-14-8Z" fill="#d4f35d" />
      <rect x="42" y="20" width="38" height="28" rx="5" fill="#ff825d" />
      <rect x="50" y="28" width="22" height="4" rx="2" fill="#fff" opacity=".9" />
      <rect x="50" y="36" width="14" height="4" rx="2" fill="#fff" opacity=".55" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 88 64" fill="none">
      <rect x="10" y="10" width="42" height="42" rx="7" fill="#59d7c5" />
      <circle cx="24" cy="24" r="6" fill="#fff" />
      <path d="M10 40l12-10 10 8 8-6 12 10v6a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7v-8Z" fill="#17252a" opacity=".28" />
      <rect x="40" y="18" width="38" height="34" rx="6" fill="#fff" stroke="#dfe5e0" />
      <rect x="48" y="26" width="22" height="4" rx="2" fill="#d4f35d" />
      <rect x="48" y="34" width="16" height="4" rx="2" fill="#ff825d" />
    </svg>
  ),
  document: (
    <svg viewBox="0 0 88 64" fill="none">
      <rect x="18" y="8" width="36" height="48" rx="4" fill="#fff" stroke="#dfe5e0" />
      <rect x="26" y="18" width="20" height="3" rx="1.5" fill="#17252a" opacity=".35" />
      <rect x="26" y="26" width="16" height="3" rx="1.5" fill="#17252a" opacity=".2" />
      <rect x="32" y="14" width="36" height="48" rx="4" fill="#d4f35d" />
      <rect x="40" y="24" width="20" height="3" rx="1.5" fill="#17252a" />
      <rect x="40" y="32" width="14" height="3" rx="1.5" fill="#17252a" opacity=".45" />
    </svg>
  ),
  developer: (
    <svg viewBox="0 0 88 64" fill="none">
      <rect x="8" y="10" width="72" height="44" rx="8" fill="#17252a" />
      <path d="M24 24l-8 8 8 8M40 24l8 8-8 8" stroke="#d4f35d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="54" y="36" width="16" height="8" rx="2" fill="#59d7c5" />
    </svg>
  ),
};

export function CategoryArt({ id }) {
  return <div className={`category-art art-${id}`}>{categoryArt[id]}</div>;
}

export function HowArt({ step }) {
  const art = [
    <svg key="1" viewBox="0 0 120 72" fill="none">
      <rect x="18" y="10" width="84" height="52" rx="10" fill="#fff" stroke="#dfe5e0" />
      <rect x="30" y="22" width="24" height="24" rx="6" fill="#d4f35d" />
      <rect x="60" y="24" width="30" height="6" rx="3" fill="#17252a" opacity=".35" />
      <rect x="60" y="36" width="22" height="6" rx="3" fill="#17252a" opacity=".18" />
    </svg>,
    <svg key="2" viewBox="0 0 120 72" fill="none">
      <rect x="14" y="14" width="40" height="44" rx="8" fill="#17252a" />
      <path d="M56 36h16" stroke="#ff825d" strokeWidth="4" strokeLinecap="round" />
      <path d="M66 28l10 8-10 8" stroke="#ff825d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="76" y="14" width="32" height="44" rx="8" fill="#59d7c5" />
    </svg>,
    <svg key="3" viewBox="0 0 120 72" fill="none">
      <rect x="36" y="8" width="48" height="40" rx="8" fill="#fff" stroke="#dfe5e0" />
      <path d="M60 28v28" stroke="#17252a" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 46l12 12 12-12" stroke="#17252a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="48" y="16" width="24" height="8" rx="2" fill="#d4f35d" />
    </svg>,
  ];
  return <div className="how-art">{art[step]}</div>;
}
