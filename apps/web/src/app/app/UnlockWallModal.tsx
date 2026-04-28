"use client"

import UpgradeModal, { type UpgradeModalProps } from "./UpgradeModal"

interface Props {
  type: "paywall" | "limit"
  onClose: () => void
}

// Thin wrapper — keeps ContactCTA API stable while delegating to UpgradeModal
export default function UnlockWallModal({ type, onClose }: Props) {
  const ctx: UpgradeModalProps["context"] = type === "paywall" ? "paywall" : "limit"
  return <UpgradeModal context={ctx} onClose={onClose} />
}
