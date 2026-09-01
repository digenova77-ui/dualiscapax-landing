# Kernels, RKHS, Gaussian processes

**Document Control ID:** ED-AI-20260901-KERNEL-GP-V1  
**Year:** 2026  
**Stamp:** 2026-09-01  
**Source:** https://arxiv.org/abs/1806.07366  
**Parent:** encyclopedia/ai_systems_internal/engineering_foundation_index.md  
**Status:** INDEXED  
**State note:** SEALED later means this file was not altered. A posterior band is a hole map, not a law. Simulation is not treatment.

Study notes. Not LIVE.

## Kernel trick

SVM dual only needs dots. k(x,x') = φ(x)·φ(x') if k is PD. Support vectors are the marks that survived.

## Mercer

Continuous PD kernel on a compact: K(s,t) = Σ λ_j e_j(s) e_j(t), uniform. That licenses φ. A non-PD “kernel” is a hole.

## RKHS

Hilbert space where evaluation is continuous. f(x) = ⟨f, k(·,x)⟩. Norm αᵀKα for finite expansions.

## Representer

Loss on f(x_i) plus nondecreasing Ω(‖f‖_H) has a minimizer in span{k(·,x_i)}. Orthogonal leftovers are invisible to the loss and expensive to the norm. Drop them.

## GP

f ~ GP(m,k). Posterior mean is representer (ridge). Variance is fat where you did not measure. Silence is a hole.

Sparse variational GP (Titsias / Hensman): inducing u = f(Z), q(f,u)=p(f|u)q(u), ELBO. Do not confuse with FITC (rewrites the prior).

SVI (Hoffman, Blei et al. 2013): minibatch ELBO, often natural gradient.

Hyperparameters: climb log p(y|θ) or ELBO from several starts. Hurt on held-out log p.

NO_FORCE. HOST_SAFE. CLEANUP_FIRST. TRUTH_OR_NOTHING.
