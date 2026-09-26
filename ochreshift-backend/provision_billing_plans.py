#!/usr/bin/env python3
"""
provision_billing_plans.py — One-shot script to create ALL Stripe products/prices
and Razorpay plans for the Ochreshift SaaS billing system.

Usage:
    # Dry-run (preview what will be created, no API calls):
    python provision_billing_plans.py --dry-run

    # Create everything for real:
    python provision_billing_plans.py

    # Only Stripe:
    python provision_billing_plans.py --stripe-only

    # Only Razorpay:
    python provision_billing_plans.py --razorpay-only

The script is IDEMPOTENT — it checks for existing products/plans by name
before creating new ones. Safe to re-run.

After running, it prints the .env block you should paste into your .env file.

Requires:
    pip install stripe razorpay python-dotenv
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

# ─── Plan Catalog ──────────────────────────────────────────────────────────
# Single source of truth for all plan pricing.
# Amounts are in the SMALLEST currency unit (cents for USD, paise for INR).

@dataclass
class PlanSpec:
    name: str               # Human-readable product name
    plan_key: str           # Internal plan key (starter, pro, business, enterprise)
    usd_monthly: int        # Monthly price in cents (e.g. 1900 = $19.00)
    usd_yearly: int         # Yearly price in cents  (e.g. 19000 = $190.00)
    inr_monthly: int        # Monthly price in paise  (e.g. 149900 = ₹1,499)
    inr_yearly: int         # Yearly price in paise   (e.g. 1499000 = ₹14,990)
    description: str        # Product description


PLANS: list[PlanSpec] = [
    PlanSpec(
        name="Ochreshift Starter",
        plan_key="starter",
        usd_monthly=1900,       # $19/mo
        usd_yearly=19000,       # $190/yr ($15.83/mo)
        inr_monthly=149900,     # ₹1,499/mo
        inr_yearly=1499000,     # ₹14,990/yr (₹1,249/mo)
        description="Essential tools for small teams & salons. 1 chatbot, 2,000 messages/mo.",
    ),
    PlanSpec(
        name="Ochreshift Pro",
        plan_key="pro",
        usd_monthly=4900,       # $49/mo
        usd_yearly=47000,       # $470/yr ($39.17/mo)
        inr_monthly=399900,     # ₹3,999/mo
        inr_yearly=3999000,     # ₹39,990/yr (₹3,332/mo)
        description="High volume, lead scoring & white-labeling. 5 chatbots, 10,000 messages/mo.",
    ),
    PlanSpec(
        name="Ochreshift Business",
        plan_key="business",
        usd_monthly=9900,       # $99/mo
        usd_yearly=95000,       # $950/yr ($79.17/mo)
        inr_monthly=799900,     # ₹7,999/mo
        inr_yearly=7999000,     # ₹79,990/yr (₹6,665/mo)
        description="For multi-location & growing teams. 25 chatbots, 50,000 messages/mo.",
    ),
    PlanSpec(
        name="Ochreshift Enterprise",
        plan_key="enterprise",
        usd_monthly=24900,      # $249/mo (contact sales, but create as a reference)
        usd_yearly=249000,      # $2,490/yr
        inr_monthly=2499900,    # ₹24,999/mo
        inr_yearly=24999000,    # ₹2,49,990/yr
        description="Custom scale, SLA, and integrations. 100+ chatbots, 250,000+ messages/mo.",
    ),
]


# ─── Stripe Provisioning ──────────────────────────────────────────────────

def provision_stripe(dry_run: bool = False) -> dict[str, str]:
    """Create Stripe Products + recurring Prices. Returns env var dict."""
    try:
        import stripe
    except ImportError:
        print("❌ `stripe` package not installed. Run: pip install stripe")
        return {}

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        print("❌ STRIPE_SECRET_KEY not set in .env")
        return {}

    mode = "TEST" if stripe.api_key.startswith("sk_test_") else "LIVE"
    print(f"\n{'='*60}")
    print(f"  STRIPE PROVISIONING ({mode} mode)")
    print(f"{'='*60}")

    env_vars: dict[str, str] = {}

    # Fetch existing products to avoid duplicates
    existing_products: dict[str, str] = {}  # name -> product_id
    existing_prices: dict[str, list] = {}   # product_id -> [prices]
    if not dry_run:
        for prod in stripe.Product.list(limit=100).auto_paging_iter():
            existing_products[prod.name] = prod.id
            existing_prices[prod.id] = list(
                stripe.Price.list(product=prod.id, limit=50).auto_paging_iter()
            )

    for plan in PLANS:
        print(f"\n  📦 {plan.name} ({plan.plan_key})")
        print(f"     USD: ${plan.usd_monthly/100}/mo, ${plan.usd_yearly/100}/yr")

        if dry_run:
            print(f"     [DRY-RUN] Would create product + 2 prices")
            env_vars[f"STRIPE_PRICE_{plan.plan_key.upper()}_MONTH"] = "price_PLACEHOLDER_MONTH"
            env_vars[f"STRIPE_PRICE_{plan.plan_key.upper()}_YEAR"] = "price_PLACEHOLDER_YEAR"
            continue

        # 1. Create or reuse Product
        if plan.name in existing_products:
            product_id = existing_products[plan.name]
            print(f"     ✅ Product already exists: {product_id}")
        else:
            product = stripe.Product.create(
                name=plan.name,
                description=plan.description,
                metadata={"plan_key": plan.plan_key},
            )
            product_id = product.id
            existing_prices[product_id] = []
            print(f"     ✅ Created product: {product_id}")

        # 2. Create monthly price (USD)
        monthly_price_id = _find_existing_stripe_price(
            existing_prices.get(product_id, []),
            currency="usd", interval="month", amount=plan.usd_monthly,
        )
        if monthly_price_id:
            print(f"     ✅ Monthly price exists: {monthly_price_id}")
        else:
            price = stripe.Price.create(
                product=product_id,
                unit_amount=plan.usd_monthly,
                currency="usd",
                recurring={"interval": "month"},
                metadata={"plan_key": plan.plan_key, "interval": "month"},
            )
            monthly_price_id = price.id
            print(f"     ✅ Created monthly price: {monthly_price_id}")

        env_vars[f"STRIPE_PRICE_{plan.plan_key.upper()}_MONTH"] = monthly_price_id

        # 3. Create yearly price (USD)
        yearly_price_id = _find_existing_stripe_price(
            existing_prices.get(product_id, []),
            currency="usd", interval="year", amount=plan.usd_yearly,
        )
        if yearly_price_id:
            print(f"     ✅ Yearly price exists: {yearly_price_id}")
        else:
            price = stripe.Price.create(
                product=product_id,
                unit_amount=plan.usd_yearly,
                currency="usd",
                recurring={"interval": "year"},
                metadata={"plan_key": plan.plan_key, "interval": "year"},
            )
            yearly_price_id = price.id
            print(f"     ✅ Created yearly price: {yearly_price_id}")

        env_vars[f"STRIPE_PRICE_{plan.plan_key.upper()}_YEAR"] = yearly_price_id

    return env_vars


def _find_existing_stripe_price(
    prices: list, currency: str, interval: str, amount: int
) -> str | None:
    """Find an existing active Stripe price matching currency, interval, amount."""
    for p in prices:
        if (
            p.active
            and p.currency == currency
            and p.recurring
            and p.recurring.interval == interval
            and p.unit_amount == amount
        ):
            return p.id
    return None


# ─── Razorpay Provisioning ────────────────────────────────────────────────

def provision_razorpay(dry_run: bool = False) -> dict[str, str]:
    """Create Razorpay Plans. Returns env var dict."""
    try:
        import razorpay
    except ImportError:
        print("❌ `razorpay` package not installed. Run: pip install razorpay")
        return {}

    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        print("❌ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in .env")
        return {}

    mode = "TEST" if key_id.startswith("rzp_test_") else "LIVE"
    print(f"\n{'='*60}")
    print(f"  RAZORPAY PROVISIONING ({mode} mode)")
    print(f"{'='*60}")

    client = razorpay.Client(auth=(key_id, key_secret))
    env_vars: dict[str, str] = {}

    # Fetch existing plans to avoid duplicates
    existing_plans: dict[str, str] = {}  # "name|period|interval|amount" -> plan_id
    if not dry_run:
        try:
            all_plans = client.plan.all({"count": 100})
            for p in all_plans.get("items", []):
                item_name = p.get("item", {}).get("name", "")
                period = p.get("period", "")
                interval = p.get("interval", 1)
                amount = p.get("item", {}).get("amount", 0)
                key = f"{item_name}|{period}|{interval}|{amount}"
                existing_plans[key] = p["id"]
        except Exception as e:
            print(f"  ⚠️ Could not fetch existing plans: {e}")

    for plan in PLANS:
        print(f"\n  📦 {plan.name} ({plan.plan_key})")
        print(f"     INR: ₹{plan.inr_monthly/100}/mo, ₹{plan.inr_yearly/100}/yr")

        if dry_run:
            print(f"     [DRY-RUN] Would create 2 plans (monthly + yearly)")
            env_vars[f"RAZORPAY_PLAN_{plan.plan_key.upper()}_MONTH"] = "plan_PLACEHOLDER_MONTH"
            env_vars[f"RAZORPAY_PLAN_{plan.plan_key.upper()}_YEAR"] = "plan_PLACEHOLDER_YEAR"
            continue

        # 1. Monthly plan
        monthly_key = f"{plan.name}|monthly|1|{plan.inr_monthly}"
        if monthly_key in existing_plans:
            monthly_plan_id = existing_plans[monthly_key]
            print(f"     ✅ Monthly plan exists: {monthly_plan_id}")
        else:
            try:
                rp = client.plan.create({
                    "period": "monthly",
                    "interval": 1,
                    "item": {
                        "name": plan.name,
                        "amount": plan.inr_monthly,
                        "currency": "INR",
                        "description": plan.description,
                    },
                    "notes": {
                        "plan_key": plan.plan_key,
                        "interval": "month",
                    },
                })
                monthly_plan_id = rp["id"]
                print(f"     ✅ Created monthly plan: {monthly_plan_id}")
            except Exception as e:
                monthly_plan_id = f"ERROR: {e}"
                print(f"     ❌ Monthly plan failed: {e}")

        env_vars[f"RAZORPAY_PLAN_{plan.plan_key.upper()}_MONTH"] = monthly_plan_id

        # 2. Yearly plan
        yearly_key = f"{plan.name}|yearly|1|{plan.inr_yearly}"
        if yearly_key in existing_plans:
            yearly_plan_id = existing_plans[yearly_key]
            print(f"     ✅ Yearly plan exists: {yearly_plan_id}")
        else:
            try:
                rp = client.plan.create({
                    "period": "yearly",
                    "interval": 1,
                    "item": {
                        "name": plan.name,
                        "amount": plan.inr_yearly,
                        "currency": "INR",
                        "description": plan.description,
                    },
                    "notes": {
                        "plan_key": plan.plan_key,
                        "interval": "year",
                    },
                })
                yearly_plan_id = rp["id"]
                print(f"     ✅ Created yearly plan: {yearly_plan_id}")
            except Exception as e:
                yearly_plan_id = f"ERROR: {e}"
                print(f"     ❌ Yearly plan failed: {e}")

        env_vars[f"RAZORPAY_PLAN_{plan.plan_key.upper()}_YEAR"] = yearly_plan_id

    return env_vars


# ─── Main ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Provision Stripe products/prices and Razorpay plans."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview what would be created without making API calls.",
    )
    parser.add_argument(
        "--stripe-only", action="store_true",
        help="Only provision Stripe (skip Razorpay).",
    )
    parser.add_argument(
        "--razorpay-only", action="store_true",
        help="Only provision Razorpay (skip Stripe).",
    )
    args = parser.parse_args()

    both = not args.stripe_only and not args.razorpay_only
    all_env_vars: dict[str, str] = {}

    if both or args.stripe_only:
        stripe_vars = provision_stripe(dry_run=args.dry_run)
        all_env_vars.update(stripe_vars)

    if both or args.razorpay_only:
        razorpay_vars = provision_razorpay(dry_run=args.dry_run)
        all_env_vars.update(razorpay_vars)

    # ── Print .env block ──
    if all_env_vars:
        print(f"\n{'='*60}")
        print("  📋 COPY THIS INTO YOUR .env FILE")
        print(f"{'='*60}\n")

        # Group by gateway
        stripe_vars = {k: v for k, v in sorted(all_env_vars.items()) if k.startswith("STRIPE_")}
        razorpay_vars = {k: v for k, v in sorted(all_env_vars.items()) if k.startswith("RAZORPAY_PLAN_")}

        if stripe_vars:
            print("# Stripe Price IDs (auto-provisioned)")
            for k, v in stripe_vars.items():
                print(f"{k}={v}")
            print()

        if razorpay_vars:
            print("# Razorpay Plan IDs (auto-provisioned)")
            for k, v in razorpay_vars.items():
                print(f"{k}={v}")
            print()

        # Also write to a file for easy copy
        env_file = "provisioned_billing_ids.env"
        with open(env_file, "w") as f:
            f.write("# Auto-generated by provision_billing_plans.py\n")
            f.write("# Copy these into your .env file\n\n")
            if stripe_vars:
                f.write("# Stripe Price IDs\n")
                for k, v in stripe_vars.items():
                    f.write(f"{k}={v}\n")
                f.write("\n")
            if razorpay_vars:
                f.write("# Razorpay Plan IDs\n")
                for k, v in razorpay_vars.items():
                    f.write(f"{k}={v}\n")
                f.write("\n")
        print(f"  💾 Also saved to: {env_file}")

    print(f"\n{'='*60}")
    print("  ✅ PROVISIONING COMPLETE")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
