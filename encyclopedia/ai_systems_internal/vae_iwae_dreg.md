# VAE, IWAE, DReG

**Document Control ID:** ED-AI-20260901-VAE-IWAE-DREG-V1  
**Year:** 2026  
**Stamp:** 2026-09-01  
**Source:** https://arxiv.org/abs/1312.6114  
**Parent:** encyclopedia/ai_systems_internal/engineering_foundation_index.md  
**Status:** INDEXED  
**State note:** SEALED later means this file was not altered. An ELBO is not log p. Simulation is not treatment.

Study notes. Not LIVE.

## VAE

Kingma and Welling 2013/14. Encoder q_φ(z|x), decoder p_θ(x|z). ELBO = E log p(x|z) − KL(q||p(z)). Reparam: z = μ + σ ⊙ ε.

Gap log p − ELBO = KL(q||p(z|x)). A dead KL with a strong decoder is posterior collapse. z did not earn its keep.

Flow-q: T(·;x) warps ε. log q uses log|det J|. Still a bound on p(x), not a flow model of x.

## IWAE

Burda, Grosse, Salakhutdinov. L_k = E log((1/k) Σ w_i) ≤ log p. L_1 is the ELBO. Large k tightens the number and can starve ∇_φ (Rainforth). Train modest k; eval large named k.

## DReG

Tucker et al. 2018. Unbiased inference-network gradient for L_k. Second reparam. SNR can grow with k. When q = p(z|x) the estimator vanishes. Does not change the bound. Changes who hears it.

NO_FORCE. HOST_SAFE. CLEANUP_FIRST. TRUTH_OR_NOTHING.
