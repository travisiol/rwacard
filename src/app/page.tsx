import { CollateralSection } from "@/components/CollateralSection";
import { FeaturePanel, SvgDefs } from "@/components/FeaturePanel";
import { HeroPanel } from "@/components/HeroPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { StageChoreography } from "@/components/StageChoreography";

export default function Home() {
  return (
    <>
      <SvgDefs />
      {/* Panels one and two live on the scaled canvas; the collateral section
          and footer are ordinary page flow below it. */}
      <div className="viewport" id="viewport">
        <div className="stage" id="stage">
          <HeroPanel />
          <FeaturePanel />
        </div>
      </div>
      <CollateralSection />
      <SiteFooter />
      <StageChoreography />
    </>
  );
}
