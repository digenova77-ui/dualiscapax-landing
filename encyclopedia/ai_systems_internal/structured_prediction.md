# Structured prediction — lattice tools

**Document Control ID:** ED-AI-20260901-STRUCT-PRED-V1  
**Year:** 2026  
**Stamp:** 2026-09-01  
**Source:** https://aclanthology.org/W02-1001/  
**Parent:** encyclopedia/ai_systems_internal/engineering_foundation_index.md  
**Status:** INDEXED  
**State note:** SEALED later means this file was not altered. A Viterbi path is a pick, not a soul. Simulation is not treatment.

Study notes. Not LIVE. Not scientifically validated because the file exists.

## Objects

HMM — hidden rooms, white tape of observations. Forward–backward, Viterbi, Baum–Welch. Rabiner 1989 three problems.

CRF — P(y|x), global Z(x), features of the whole tape. Lafferty, McCallum, Pereira 2001. Features are the figure.

M3N — max-margin on a Markov net of labels. Taskar, Guestrin, Koller 2003.

Structured SVM — score w·Ψ(x,y), loss-augmented decode, cutting planes. Tsochantaridis et al. 2005.

Structured perceptron — decode; on miss add Ψ(x,y)−Ψ(x,ŷ). Collins 2002. Ship the averaged w.

## Check

Named Δ and a decoder you can run. Hurt ŷ on labeled spans. Token accuracy is a smear. Halt if you trained Hamming and brag F1.

NO_FORCE. HOST_SAFE. CLEANUP_FIRST. TRUTH_OR_NOTHING.
