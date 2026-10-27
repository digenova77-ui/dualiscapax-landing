# Symplectic diagnostic: evidence boundary

## Scope inspected

This note records a narrow inspection of `pipe.html` and the dedicated test workflow. It is not a repository-wide or mathematical-physics certification.

## What the current page does

In `pipe.html`, the visual stage is assembled from CSS rings, gradients, and animation. The page includes a diagnostic block with fixed display strings:

- `det(M) ≡ 1.000000000000`
- `R_eff ≤ 4.18e-13`
- `watchdog < 4.20 ms`

The inspected page does not compute those values in the diagnostic block. The nearby CSS comments explicitly describe the geometry as a visualisation. These numbers therefore must not be interpreted as live measurements produced by this page.

## What has been verified

The separate Python test suite checks the numerical residual
`max_ij |(S^T J S - J)_ij|` for selected 4x4 matrices using the convention `J = [[0,I],[-I,0]]`. It includes an identity case, a constructed symplectic case, a determinant-one counterexample, and a dimension rejection case. Its GitHub Actions run passed on the PR commit before merge.

This verifies those test cases and helper implementation only. It does not verify that `pipe.html`, a deployed service, or another runtime uses the tested calculation.

## Safe claim language

Until a real runtime calculation is connected and independently checked, describe the page as an **illustrative geometric visualisation**. Do not label the displayed constants as live, measured, or proven outputs.

## Next verification gate

Before claiming a live implementation:

1. Identify the actual runtime function and its input matrix source.
2. Compute `S^T J S - J` from that runtime matrix, report a defined norm and tolerance, and fail closed on invalid dimensions/non-finite values.
3. Test valid transformations and determinant-one non-symplectic counterexamples.
4. Bind the CI result to the exact commit and deployed version.
5. Keep display-only/demo values visibly labelled as illustrative.

## Limitations

This note does not establish that no valid symplectic implementation exists elsewhere in the repository or other repositories. It records only the files and behavior described above.
