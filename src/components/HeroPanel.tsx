import { media } from "@/lib/media";
import { site } from "@/lib/site";
import { Topbar } from "@/components/Topbar";

export function HeroPanel() {
  return (
    <div className="panel-slot">
      <section className="panel hero" id="top">
        <div className="hero__scene">
          <div className="hero__pane hero__pane--left" />

          <div className="hero__pane hero__pane--right showcase" id="cards">
            {/* Muted, looping and decorative: the clip carries no information
                the copy beside it does not already state. */}
            <video
              className="showcase__video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={media.heroPoster}
              aria-hidden="true"
            >
              <source src={media.heroVideo} type="video/mp4" />
            </video>
            <p className="showcase__eyebrow">Cards on the {site.chain}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="showcase__card"
              src={media.cardFront}
              width={301}
              height={423}
              alt={`Brushed metal ${site.name}`}
            />
            <div className="showcase__copy" id="spending">
              <h2 className="showcase__title">
                Global
                <br />
                Spending
              </h2>
              <p className="showcase__sub">
                Spend tokenised assets instantly,
                <br />
                settled in {site.settlement} anywhere
              </p>
            </div>
            <div className="dots" role="group" aria-label="Card showcase">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={index === 0 ? "dot is-active" : "dot"}
                  type="button"
                  aria-pressed={index === 0}
                  aria-label={`Show card ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="hero__content">
            <h1 className="hero__title">
              <span className="hero__line">Spend</span>
              <span className="hero__line">Your</span>
              <span className="hero__line">RWAs</span>
            </h1>
            <p className="hero__lede">
              Cards on the {site.chain}. No KYC, funded
              <br />
              by real-world assets and ETH, settled in {site.settlement}
            </p>
            <a className="cta" href={site.cta}>
              <span className="cta__label">Get a Card</span>
              <span className="cta__arrow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.arrow} width={21} height={21} alt="" />
              </span>
            </a>
          </div>
        </div>

        <Topbar menuId="nav-menu-hero" navLabel="Primary" />
      </section>
    </div>
  );
}
