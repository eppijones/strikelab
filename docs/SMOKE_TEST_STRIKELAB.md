# StrikeLab field smoke test (range + course)

Use this checklist on real hardware before relying on data in competition.

## Range (watch)

1. Start a range session. **READY** screen shows club, count, and tempo bar when personal windows sync from the phone.
2. Hit 3–5 swings. **RESULT** overlay (swipe for details) shows one tempo number; lime when inside the window, ink when outside.
3. End session with phone in airplane mode, then restore — session should land in history (existing ACK path).

## Range (iPhone)

1. Open a swing from the live range card. **Hero tempo + signature rows + drift strip** at top; **SHOW SWING DETAILS** expands to prior gauges.
2. Kill the app mid-session, reopen — live session restores (`PersistenceManager`).

## Course (iPhone + watch)

1. Start a round. Watch receives **hole pins** + round config.
2. On the live hole screen, walk **>5 yards** — watch **caddie tile** updates (yards + club + phrase).
3. Tap tile → club picker opens with suggested club pre-selected. Double-tap tile → same.
4. If GPS is available on the watch, tile can recompute yards from **pin** when the phone is quiet.

### Auto stroke confirmation (watch)

5. **Fairway / tee:** Motion creates a **pending** swing; walk **≥ ~10 m** (or start a new swing from a new GPS lie) to **confirm**; long idle with only a small wander may still confirm (whiff + shuffle).
6. **On / near green (≤ ~25 m to pin):** A detected swing **confirms immediately** without walking; **putts** increment when **≤ ~18 m** to pin or when **PUTTS** is selected and distance **≤ ~45 m** (or distance unknown in putts mode).
7. **OB / reload:** Two swings on the **same hole** within **~2.5 s** at **different** lies confirm the first then start the second (does not apply to same-spot practice — those still **coalesce**).

## Regression

- `SwingInspectorView` → Run analytics self-test (DEBUG).
- Profile → **My Bag** → lever ratio lines appear only with ≥3 GPS-tagged shots per club.
