"use client";

import { useMemo, useReducer, useState } from "react";
import {
  GRACE_DAYS,
  MAX_LINE_USD,
  MIN_LINE_USD,
  OPEN_FEE_USD,
  collateralSteps,
  initialSim,
  parseAmount,
  simReducer,
  usd,
} from "@/lib/collateral";
import { site } from "@/lib/site";

export function CollateralSection() {
  const [state, dispatch] = useReducer(simReducer, initialSim);
  const [lockAmount, setLockAmount] = useState("100");
  const [spendAmount, setSpendAmount] = useState("40");

  const status = useMemo(() => {
    if (state.locked === 0) return "No card open";
    return state.bill > 0 ? `${usd(state.bill)} owed` : "Settled";
  }, [state.locked, state.bill]);

  return (
    <div className="snap-slot" id="collateral">
      <section className="collateral" aria-labelledby="collateral-title">
        <div>
          <p className="collateral__eyebrow">Collateral card</p>
          <h2 className="collateral__title" id="collateral-title">
            A credit card
            <br />
            you back yourself
          </h2>
          <p className="collateral__lede">
            Lock $100 and you get a $100 card. Spending draws on a credit line rather than on the
            deposit, so a bill accrues the way it would on any credit card - and the collateral is
            released the moment that bill is settled. No underwriting, no KYC, no interest. A flat $
            {OPEN_FEE_USD} to open, lines from ${MIN_LINE_USD} to $
            {MAX_LINE_USD.toLocaleString("en-US")}, and a bill left unpaid for {GRACE_DAYS} days
            closes the card, settled out of the collateral.
          </p>
          <ol className="steps">
            {collateralSteps.map((step, index) => (
              <li className="step" key={step.title}>
                <span className="step__index" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__desc">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="sim">
          <div className="sim__head">
            <p className="sim__label">Try the mechanic</p>
            <p className="sim__state" aria-live="polite">
              {status}
            </p>
          </div>

          <dl className="sim__rows">
            <div className="sim__row">
              <dt>Collateral locked</dt>
              <dd>{usd(state.locked)}</dd>
            </div>
            <div className="sim__row sim__row--free">
              <dt>Available to spend</dt>
              <dd>{usd(state.available)}</dd>
            </div>
            <div className="sim__row sim__row--due">
              <dt>Bill outstanding</dt>
              <dd>{usd(state.bill)}</dd>
            </div>
          </dl>

          <div className="sim__field" style={{ marginTop: 18 }}>
            <label htmlFor="lock-amount">Collateral to lock</label>
            <div className="sim__input">
              <span>$</span>
              <input
                id="lock-amount"
                type="number"
                min={0}
                step={10}
                value={lockAmount}
                onChange={(event) => setLockAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="sim__field">
            <label htmlFor="spend-amount">Purchase / repayment amount</label>
            <div className="sim__input">
              <span>$</span>
              <input
                id="spend-amount"
                type="number"
                min={0}
                step={5}
                value={spendAmount}
                onChange={(event) => setSpendAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="sim__actions">
            <button
              className="sim__btn sim__btn--primary"
              type="button"
              onClick={() => dispatch({ type: "lock", amount: parseAmount(lockAmount) })}
            >
              Lock collateral
            </button>
            <button
              className="sim__btn"
              type="button"
              disabled={state.locked === 0}
              onClick={() => dispatch({ type: "spend", amount: parseAmount(spendAmount) })}
            >
              Spend
            </button>
            <button
              className="sim__btn"
              type="button"
              disabled={state.bill === 0}
              onClick={() => dispatch({ type: "repay", amount: parseAmount(spendAmount) })}
            >
              Repay
            </button>
            <button
              className="sim__btn"
              type="button"
              disabled={state.locked === 0 || state.bill > 0}
              onClick={() => dispatch({ type: "withdraw" })}
            >
              Withdraw
            </button>
            <button
              className="sim__btn"
              type="button"
              disabled={state.bill === 0}
              onClick={() => dispatch({ type: "repay", amount: state.bill })}
            >
              Repay in full
            </button>
          </div>

          <p className="sim__note" aria-live="polite">
            {state.note}
          </p>
          <p className="sim__demo-note">
            A sandbox, not your wallet. Nothing here touches the chain -{" "}
            <a href={site.cta}>open a real card</a>.
          </p>

          {state.ledger.length > 0 && (
            <ul className="sim__ledger">
              {state.ledger.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.label}</span>
                  <span>{usd(Math.abs(entry.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
