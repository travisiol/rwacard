import { site } from "@/lib/site";

/**
 * Terms of the collateral card. The landing copy, the sandbox and the footer
 * disclosure all read these, so a change to the product is a change here.
 */
export const OPEN_FEE_USD = 15;
export const MIN_LINE_USD = 50;
export const MAX_LINE_USD = 1000;
export const GRACE_DAYS = 30;

export const usd = (amount: number) =>
  amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

/** Cents, not floats — the sandbox adds and subtracts a lot of small numbers. */
const round = (amount: number) => Math.round(amount * 100) / 100;

export type LedgerEntry = { id: number; label: string; amount: number };

export type SimState = {
  locked: number;
  available: number;
  bill: number;
  note: string;
  ledger: LedgerEntry[];
  seq: number;
};

export type SimAction =
  | { type: "lock"; amount: number }
  | { type: "spend"; amount: number }
  | { type: "repay"; amount: number }
  | { type: "withdraw" };

export const initialSim: SimState = {
  locked: 0,
  available: 0,
  bill: 0,
  note: "Lock collateral to open a card. The spending line always equals the deposit.",
  ledger: [],
  seq: 0,
};

function logged(state: SimState, label: string, amount: number) {
  return {
    seq: state.seq + 1,
    ledger: [{ id: state.seq + 1, label, amount }, ...state.ledger].slice(0, 12),
  };
}

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "lock": {
      if (action.amount <= 0) return { ...state, note: "Enter an amount above zero." };
      const locked = round(state.locked + action.amount);
      return {
        ...state,
        locked,
        available: round(state.available + action.amount),
        ...logged(state, "Collateral locked", action.amount),
        note: `${usd(action.amount)} locked. Your line is ${usd(locked)} and the deposit stays untouched.`,
      };
    }

    case "spend": {
      if (action.amount <= 0) return { ...state, note: "Enter an amount above zero." };
      if (action.amount > state.available) {
        return {
          ...state,
          note: `Declined - only ${usd(state.available)} of the line is left. Repay the bill to free it up.`,
        };
      }
      return {
        ...state,
        available: round(state.available - action.amount),
        bill: round(state.bill + action.amount),
        ...logged(state, "Card purchase", -action.amount),
        note: `${usd(action.amount)} spent against the line, so ${usd(
          action.amount,
        )} is now owed. No interest, no due date - but ${GRACE_DAYS} days unpaid closes the card.`,
      };
    }

    case "repay": {
      if (state.bill <= 0) return { ...state, note: "Nothing owed right now." };
      if (action.amount <= 0) return { ...state, note: "Enter an amount above zero." };
      const paid = Math.min(action.amount, state.bill);
      const bill = round(state.bill - paid);
      return {
        ...state,
        bill,
        available: round(state.available + paid),
        ...logged(state, "Repaid", paid),
        note:
          bill > 0
            ? `${usd(paid)} repaid, ${usd(bill)} still owed. That much of the line is spendable again.`
            : `${usd(paid)} repaid. Nothing owed - the collateral can be withdrawn.`,
      };
    }

    case "withdraw": {
      if (state.bill > 0) {
        return {
          ...state,
          note: `The collateral is frozen while ${usd(state.bill)} is owed. Repay it first.`,
        };
      }
      if (state.locked <= 0) return { ...state, note: "Nothing locked to withdraw." };
      return {
        ...initialSim,
        seq: state.seq + 1,
        ledger: [
          { id: state.seq + 1, label: "Collateral released", amount: state.locked },
          ...state.ledger,
        ].slice(0, 12),
        note: `${usd(state.locked)} returned to your wallet. The card closes with it.`,
      };
    }
  }
}

/** Reads a raw input value; anything unparseable is a zero, never a NaN. */
export function parseAmount(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? round(parsed) : 0;
}

export const collateralSteps = [
  {
    title: "Lock collateral",
    desc: `Deposit the limit you want in ${site.settlement}, ETH or a tokenized asset. Lock $100 and the card opens with a $100 line.`,
  },
  {
    title: "Spend the line",
    desc: "Purchases draw on the line, not on your deposit. The collateral stays locked and untouched.",
  },
  {
    title: "A bill accrues",
    desc: "Whatever you spend is what you owe. No cycle, no statement date, no interest - the bill just sits there.",
  },
  {
    title: "Settle, then withdraw",
    desc: `Repay in ${site.settlement}, ETH or RWAs whenever you like. Once the bill hits zero the collateral unlocks in full.`,
  },
] as const;
