---
title: Rendering Budgets for Standalone Headsets
date: 2026-01-12
readMinutes: 4
category: Engineering
slug: rendering-budgets-for-standalone-headsets
excerpt: A standalone headset is a phone strapped to your face. Treat the frame budget like the scarce resource it is, and the experience stays smooth.
---

A standalone headset is, in performance terms, a phone strapped to your face.
The frame budget is the scarce resource, and every draw call competes for it.

## Where the budget goes

- **Draw calls** — batch aggressively; the mobile GPU punishes them hard.
- **Overdraw** — transparent layers stack up costs you cannot see in the editor.
- **Texture memory** — the cap is real, and exceeding it stutters mid-session.

Profile on the target device, not the desktop. The numbers that matter are the
ones the headset reports.
