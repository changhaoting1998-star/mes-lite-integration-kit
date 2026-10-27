# Contributing

Thanks for helping improve MES Lite Integration Kit.

## Good contributions

- A focused manufacturing rule with tests
- An adapter or event-contract example using synthetic payloads
- Idempotency, quality or traceability improvements
- Clearer documentation for learners and integrators

## Development

```bash
npm install
npm run verify
```

Never submit real production orders, formulas, customer or supplier records, costs, device identifiers, shift data, logs or credentials. Use `demo_` identifiers and fictional values in every fixture.

Open an issue before a large change. Pull requests should explain the manufacturing behavior, include meaningful tests and keep vendor-specific code behind an adapter.
