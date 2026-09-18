Adventure Incremental — V13-Warrior-Beta

External playtest build for the Warrior route.

- Only the Warrior route is available.
- Gameplay balance matches the Warrior Time Rebalance build.
- Instant Tasks and balance/debug controls are hidden.
- Save data is isolated under its own beta save key.
- QA telemetry is stored in the save: focused/visible play time, task starts/completions, loop resets, stage visits, highest stage, and first Warrior clear snapshot.
- Use the QA Report button at any time to copy a pasteable test report.


AUTO TEST UPDATE
- Global Auto unlock: clear Warrior Stage 3 once.
- A stage's Auto checkboxes unlock after that stage has been cleared once.
- Checked tasks run once per loop, using normal time, Energy, XP, and requirements.
- Auto is route-clearing QoL only; Repeat/farming automation is not implemented.

Energy curve:
- Below 100% proficiency: p^-1.5
- At/above 100% proficiency: p^-0.75
- Minimum Energy cost remains 10% of base.
- Same warrior-beta-auto save namespace is preserved for beta migration.
