import { media } from "@/lib/media";
import { site } from "@/lib/site";
import { Topbar } from "@/components/Topbar";

/** The two ring gradients every arc on this panel strokes itself with. */
export function SvgDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <linearGradient id="ringDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5436" stopColor="#999999" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="ringUp" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0.5436" stopColor="#999999" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.14" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Ring({
  className,
  size,
  gradient = "ringDown",
}: {
  className: string;
  size: number;
  gradient?: "ringDown" | "ringUp";
}) {
  const c = size / 2;
  return (
    <svg
      className={`lring ${className}`}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={c} cy={c} r={c - 0.5} fill="none" stroke={`url(#${gradient})`} strokeWidth="1" />
    </svg>
  );
}

export function FeaturePanel() {
  return (
    <div className="panel-slot">
      <section className="panel lifestyle" id="features">
        <div className="lifestyle__scene">
          <h2 className="lifestyle__title">
            Onchain,
            <br />
            No Paperwork
          </h2>

          <div className="lifestyle__grid">
            {/* 1 — custody */}
            <div className="lcard-slot">
              <article className="lcard lcard--security">
                <div className="lcard__surface" />
                <div className="lcard__content">
                  <Ring className="lring--security" size={481} />
                  <div className="keyplate" />
                  <h3 className="lcard__title">
                    No KYC,
                    <br />
                    Non-Custodial
                  </h3>
                  <p className="lcard__desc">
                    No documents, no ID upload. Your keys
                    <br />
                    hold the funds, the card just spends them.
                  </p>
                  <div className="keyplate__well" />
                  {/* Two stacked copies: soft-light over the plate, then over
                      the well, which is what gives the key its etched edge. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="keyplate__key" src={media.key} width={73} height={73} alt="" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="keyplate__key" src={media.key} width={73} height={73} alt="" />
                  <span className="ltag ltag--soa">No KYC required</span>
                </div>
              </article>
            </div>

            {/* 2 — yield */}
            <div className="lcard-slot">
              <article className="lcard lcard--staking">
                <div className="lcard__surface" />
                <div className="lcard__content">
                  <h3 className="lcard__title">
                    Yield-Bearing
                    <br />
                    Balances
                  </h3>
                  <p className="lcard__desc">
                    Tokenised treasuries and ETH keep earning
                    <br />
                    right up to the moment you tap the card
                  </p>
                  <Ring className="lring--orbit-outer" size={505} />
                  <Ring className="lring--orbit-inner" size={265} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="orbit__card"
                    src={media.cardOrbit}
                    width={346}
                    height={264}
                    alt={`Brushed black ${site.name}`}
                  />
                  <div className="orbit__badge" />
                  <div className="orbit__badge-inner" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="orbit__bolt" src={media.bolt} width={38} height={39} alt="" />
                  <span className="ltag ltag--yield">RWA yield</span>
                </div>
              </article>
            </div>

            {/* 3 — settlement */}
            <div className="lcard-slot">
              <article className="lcard lcard--transfers">
                <div className="lcard__surface" />
                <div className="lcard__content">
                  {/* Not autoplayed: StageChoreography starts this one when the
                      panel actually arrives, and adds .has-transfer-loop so the
                      travelling dot only runs while the globe is turning. */}
                  <video
                    className="globe"
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={media.globePoster}
                    aria-hidden="true"
                  >
                    <source src={media.globeVideo} type="video/mp4" />
                  </video>
                  <div className="globe-fade" />
                  <h3 className="lcard__title">
                    {site.settlement}
                    <br />
                    Settlement
                  </h3>
                  <p className="lcard__desc">
                    Every authorisation clears in {site.settlement}
                    <br />
                    on the {site.chain} in seconds
                  </p>
                  <Ring className="lring--transfers" size={481} gradient="ringUp" />
                  <span className="ltag ltag--wallet">Any wallet</span>
                  <span className="ltag ltag--bank">Any merchant</span>
                  <span className="transfer-node-path" aria-hidden="true">
                    <span className="node-dot" />
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>

        <Topbar menuId="nav-menu-lifestyle" navLabel="Sections" />
      </section>
    </div>
  );
}
