# Error: Missing GitHub Icon Export

## Error
```
Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/lucide-react.js?v=8024b8f0' does not provide an export named 'GitHub' (at Header.tsx:1:31)
```

## Root Cause
The project uses `lucide-react@1.24.0`, which does **not** include a GitHub icon at all (neither `GitHub` nor `Github`). There is no GitHub-related icon available in this version.

## Solution
1. Removed `GitHub`/`Github` from the imports in `src/components/Header.tsx`
2. Replaced the icon component with plain text (`<span>GitHub</span>`) inside the link button

## Result
The error is resolved by avoiding the missing icon entirely and using a text label instead.
