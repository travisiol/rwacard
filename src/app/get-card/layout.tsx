import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { WalletProvider } from "@/components/WalletProvider";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Get a card | ${site.name}`,
  description: `Connect a browser wallet to open a ${site.name}. No email, no documents, no KYC.`,
};

export default function GetCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AppShell>{children}</AppShell>
    </WalletProvider>
  );
}
