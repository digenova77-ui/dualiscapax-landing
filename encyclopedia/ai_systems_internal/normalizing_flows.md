# Normalizing flows — change of variables

**Document Control ID:** ED-AI-20260901-FLOWS-V1  
**Year:** 2026  
**Stamp:** 2026-09-01  
**Source:** https://arxiv.org/abs/1906.04032  
**Parent:** encyclopedia/ai_systems_internal/engineering_foundation_index.md  
**Status:** INDEXED  
**State note:** SEALED later means this file was not altered. A sample sheet is not log p. Simulation is not treatment.

Study notes. Not LIVE.

## Book

x = T(u), u ~ p_u, T invertible.

p_x(x) = p_u(T⁻¹(x)) |det J_{T⁻¹}(x)|

No det, no flow.

## Slots

Affine coupling — weak, cheap.  
Neural spline flow (Durkan et al. 2019) — RQ monotone spline, inverse is a quadratic. Knots increase, δ > 0.  
UMNN — integrate g>0; quadrature; inverse is a search.  
CNF / FFJORD — Neural ODE; d/dt log p = −tr(∂f/∂z); Hutchinson for the trace.

Libraries to try first: Zuko (NSF/MAF), torchdiffeq for CNF.

## RQ inverse (the branch that sits)

After the forward map that hits the next knot, Aξ²+Bξ+C=0 and

ξ = (−B + sqrt(B²−4AC)) / (2A)

so ξ=0 when the rise is 0. If Δ<0 the piece was not monotone. Halt.

## Neural ODE / adjoint

dopri5 default. atol/rtol are scope. Adjoint is a second ODE. Same tols at train and eval. NFE is postage.

NO_FORCE. HOST_SAFE. CLEANUP_FIRST. TRUTH_OR_NOTHING.
