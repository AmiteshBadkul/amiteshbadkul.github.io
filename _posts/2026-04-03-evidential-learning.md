---
layout: post
title: Evidential Deep Learning
date: 2026-04-03 13:56:00-0400
description: A review of "Evidential Deep Learning to Quantify Classification Uncertainty" by Sensoy, Kaplan & Kandemir (NeurIPS 2018).
tags: uncertainty ml dl
categories: literature-review
disqus_comments: true
related_posts: false
---

# About

This post is my review of **"Evidential Deep Learning to Quantify Classification Uncertainty"** by Murat Sensoy, Lance Kaplan, and Melih Kandemir, published at NeurIPS 2018. The paper proposes a principled, computationally lightweight approach to uncertainty quantification in classification, grounded in the Theory of Evidence. I have tried to write this in a way that is accessible but does not shy away from the math.

---

# The Problem

Deep learning models have achieved remarkable accuracy across a wide range of tasks, but accuracy alone is not sufficient for deployment in the real world. A critical flaw persists: these models are severely overconfident. Every prediction comes wrapped in high confidence, regardless of whether the input is familiar or completely outside anything the model has seen before.

For low-stakes tasks — classifying cats versus dogs, tagging social media images — this is tolerable. However, consider the following:

- **Autonomous driving:** Multiple high-profile failures have been linked to ML systems that were confidently wrong. A Tesla Autopilot fatality in 2016 occurred when the system misclassified a white truck as sky [[NTSB report](https://www.ntsb.gov/investigations/Pages/HWY16FH018.aspx)]. Confidence without calibration is dangerous.
- **Medical diagnosis:** ML-assisted diagnostic tools that assign inflated confidence to incorrect predictions can mislead clinicians, particularly in edge cases or underrepresented populations [[Obermeyer & Emanuel, 2016](https://www.nejm.org/doi/full/10.1056/NEJMp1606181)].
- **Drug discovery:** Molecular property prediction models that cannot flag their own uncertainty may wastefully prioritize compounds unlikely to succeed in wet-lab validation.

The fundamental need is **per-prediction uncertainty quantification**: alongside each output, the model should report how confident it actually is in that output. This makes models more reliable, more interpretable, and more appropriate for deployment in systems where incorrect predictions have real consequences. If an autonomous vehicle knows it is uncertain — perhaps because a sensor is degraded or the scenario is novel — it can hand control back to the driver rather than guess.

When this paper was published in 2018, the dominant approach to uncertainty in classification was to read off the softmax output probabilities and treat them as confidence estimates. This turns out to be a poor proxy, for reasons we will get to.

---

# Issues with Softmax

The standard classification pipeline converts raw neural network outputs $$f_k(x, \theta)$$ into class probabilities using the softmax function:

$$\sigma(f_k) = \frac{e^{f_k}}{\sum_{j=1}^{K} e^{f_j}}$$

This is elegant and well-studied, but it has a structural limitation: the outputs always sum to one. The model is forced to distribute its belief across the known classes, no matter what input it receives. Feed a trained cat-versus-dog classifier an image of a horse, and it will return something like [0.70 dog, 0.30 cat]. There is no mechanism to say *"I have never seen anything like this"* — the probabilities must fill the simplex.

This creates two related problems.

**First, overconfidence on out-of-distribution inputs.** Because the exponentiation in softmax amplifies the largest logit, the predicted class almost always receives disproportionately high probability. A rotation of the input digit by 90 degrees, for instance, causes LeNet to misclassify it — but with high softmax confidence. The model does not know what it does not know.

**Second, conflation of probability with confidence.** A softmax output of 0.80 for class A tells you the model's best estimate of P(class = A). It says nothing about how trustworthy that estimate is. What we actually want is a system that can distinguish between two very different situations:

> *"I predict class A with 80% probability, and I am confident in this estimate."*

> *"I predict class A with 80% probability, but this estimate is highly uncertain — treat it with scepticism."*

Softmax cannot make this distinction. It provides a **first-order** probability — a point estimate on the simplex — but no **second-order** information about the reliability of that point estimate. This miscalibration problem is well-documented; Guo et al. (2017) [Calibration of Modern Neural Networks] provide an in-depth empirical analysis and are worth reading alongside this paper.

---

# Why Not Bayesian Neural Networks?

A natural response to the calibration problem is Bayesian Neural Networks (BNNs). Rather than learning a single set of weights $$\theta$$, BNNs place a prior distribution over the weights and infer the posterior $$p(\theta \mid \mathcal{D})$$ after observing data. Predictions are then made by marginalizing over the weight posterior:

$$p(y^* \mid x^*, \mathcal{D}) = \int p(y^* \mid x^*, \theta) \, p(\theta \mid \mathcal{D}) \, d\theta$$

The variance of this **posterior predictive distribution** captures epistemic uncertainty — uncertainty arising from limited data rather than from irreducible noise in the labels.

The problem is that this integral is intractable for deep networks. In practice, BNNs approximate it using Monte Carlo sampling (e.g., running the network multiple times with dropout active and treating the variation in outputs as a proxy for uncertainty — as in Gal & Ghahramani, 2016). This approximation introduces noise, is computationally expensive, and does not scale well. Gaussian Processes (GPs) offer a non-parametric alternative with closed-form uncertainty estimates, but they do not scale to the input dimensionalities typical of image or language data without significant approximation.

EDL takes a different route entirely. Rather than inferring a distribution over weights and propagating it through the network, it directly outputs a distribution over possible class probability vectors — a Dirichlet distribution — from a single deterministic forward pass.

---

# Proposed Solution: Evidential Deep Learning

Sensoy et al. draw on the **Theory of Subjective Logic** [Josang, 2016], which is itself a formalization of the **Dempster-Shafer Theory of Evidence (DST)** [Dempster, 1968] using probability distributions. The full mathematical background is outside the scope of this post, but the core idea is this:

Classical probability requires your belief to be fully distributed across the known hypotheses. DST relaxes this. It allows you to assign belief mass to *sets* of hypotheses, including the entire set — which is a formal way of saying *"I do not know which of these is true."* Subjective Logic operationalizes this using Dirichlet distributions, and EDL is the deep learning adaptation.

The key architectural change relative to a standard classifier is minimal:

> **Replace the softmax output layer with a ReLU activation.**

The non-negative outputs of this layer are interpreted as an **evidence vector** $$e = [e_1, \ldots, e_K]$$, where $$e_k \geq 0$$ is the evidence the network has collected in favour of class $$k$$. The Dirichlet parameters are then:

$$\alpha_k = e_k + 1$$

So when the network has collected zero evidence for all classes (completely uncertain), all $$\alpha_k = 1$$, giving the uniform Dirichlet — the "I do not know" state. As evidence accumulates, the Dirichlet concentrates around a particular class assignment.

<!--- Suggested figure: a 3D simplex showing (1) softmax as a single point on the simplex, and (2) the Dirichlet as a distribution over the simplex, visualised as a density. This would make the "factory of point estimates" idea concrete. -->

---

## The Math

The key quantities in the framework are:

| Quantity | Formula | Interpretation |
|---|---|---|
| Dirichlet strength | $$S = \sum_{k=1}^{K} \alpha_k$$ | Total evidence across all classes |
| Expected class probability | $$\hat{p}_k = \alpha_k / S$$ | Analogous to softmax output |
| Belief mass (class k) | $$b_k = e_k / S = (\alpha_k - 1) / S$$ | Confidence attributed specifically to class k |
| Uncertainty mass | $$u = K / S$$ | Global uncertainty; inversely proportional to total evidence |

The constraint $$u + \sum_{k} b_k = 1$$ always holds. When evidence is zero for all classes, $$S = K$$, so $$u = 1$$ — total uncertainty. As evidence grows, $$S$$ grows, $$u$$ shrinks, and the belief masses increase.

Note that $$\hat{p}_k$$ is the EDL analog of the softmax output. For in-distribution inputs, these should roughly agree with softmax probabilities. The important addition is $$S$$: a large $$S$$ means the Dirichlet is sharply concentrated and $$\hat{p}_k$$ is reliable; a small $$S$$ (close to $$K$$) means the model has little evidence and the predicted probability should not be trusted.

---

## Loss Function

The paper considers three loss formulations and settles on the **sum-of-squares Bayes risk**, which has a clean decomposition:

$$\mathcal{L}_i(\Theta) = \sum_{j=1}^{K} \underbrace{(y_{ij} - \hat{p}_{ij})^2}_{\text{prediction error}} + \underbrace{\frac{\hat{p}_{ij}(1 - \hat{p}_{ij})}{S_i + 1}}_{\text{variance}}$$

The first term drives the mean of the Dirichlet toward the true label. The second term penalizes high variance in the Dirichlet, which shrinks as evidence grows — the model is rewarded for being confident *when it is right*. Proposition 1 in the paper guarantees that the variance term is always smaller than the prediction error term, ensuring data fit is always the priority.

On top of this, a **KL divergence regularisation term** is added:

$$\mathcal{L}(\Theta) = \sum_{i=1}^{N} \mathcal{L}_i(\Theta) + \lambda_t \sum_{i=1}^{N} \text{KL}\left[D(p_i \mid \tilde{\alpha}_i) \,\|\, D(p_i \mid \mathbf{1})\right]$$

where $$\tilde{\alpha}_i$$ is the Dirichlet parameter vector after zeroing out the evidence for the correct class, $$D(p \mid \mathbf{1})$$ is the uniform Dirichlet ("I do not know"), and $$\lambda_t = \min(1.0,\, t/10)$$ is an annealing coefficient that increases over the first 10 training epochs.

The role of this term is specific: it penalises the model for maintaining evidence on *incorrect* classes when that evidence does not contribute to data fit. It does not teach the model to always say "I do not know" — it teaches the model to *not be confidently wrong*. The annealing ensures the model has freedom to explore early in training before being regularised toward the uniform distribution on misfits.

One notable gap: the paper does not include an ablation study showing what happens when this term is removed. This would have been informative.

---

## Why Dirichlet?

A Dirichlet distribution is a probability distribution *over* probability vectors — it lives naturally on the simplex, which is precisely where class probability vectors live. Where softmax gives you a single point on the simplex, the Dirichlet gives you a distribution over it. In the authors' words, it is a "factory of point estimates" — each sample from the Dirichlet is one possible softmax-like output, and the distribution over samples captures how uncertain the model is about which output is correct.

Three concrete reasons Dirichlet is the right choice here:

1. **Conjugacy.** The Dirichlet is the conjugate prior for the categorical and multinomial distributions. When new evidence arrives, updating the Dirichlet is as simple as incrementing the relevant $$\alpha_k$$. This gives the framework a clean Bayesian interpretation.
2. **Domain match.** Dirichlet is defined on the simplex $$\mathcal{S}_K$$, exactly the domain of valid class probability vectors.
3. **Interpretability.** The parameters $$\alpha_k$$ behave as pseudo-counts of evidence. $$\alpha_k = 1$$ means zero evidence for class $$k$$; higher values mean accumulated support. This maps cleanly onto the evidential reasoning framework.

---

# Experimental Setup and Results

The paper evaluates against standard deterministic networks (L2 regularised), MC Dropout, Deep Ensembles, and several Bayesian variational inference methods (FFGU, FFLU, MNFG), all using the same LeNet architecture for fairness.

Three evaluation axes are used:

**1. Standard classification accuracy.** EDL is competitive with all baselines on both MNIST (99.3%) and CIFAR5 (83%), confirming that the uncertainty extensions do not hurt raw predictive performance. The claim is not that EDL is more accurate, but that it is equally accurate while being better calibrated.

**2. Out-of-distribution detection.** Models are trained on MNIST and evaluated on notMNIST (letters, not digits). We expect predictions to have maximum entropy — the model should be uncertain about everything it has never seen. Figure 3 (left) shows empirical CDFs of prediction entropy across all test inputs. The ideal curve hugs the bottom-right corner: most predictions have high entropy, meaning the model correctly admits it does not know. EDL's curve is closest to this ideal; the baselines rise earlier, indicating they assign low entropy (high confidence) to out-of-distribution inputs. The same experiment is repeated for CIFAR10: training on five categories and testing on the held-out five. Results are consistent.

**3. Adversarial robustness.** Adversarial examples are generated using the Fast Gradient Sign Method (FGSM) at varying perturbation magnitudes $$\epsilon$$. Figure 4 shows accuracy and entropy as functions of $$\epsilon$$. Dropout achieves the highest adversarial accuracy but is overconfident on its wrong predictions — it assigns low entropy even when $$\epsilon$$ is large. EDL sacrifices some adversarial accuracy relative to Dropout, but its entropy rises appropriately as $$\epsilon$$ increases: it knows when it is being attacked.

<!--- Suggested: include Figures 1, 3, and 4 from the paper with proper attribution (arXiv open access). Figure 1 (rotated digit) is especially compelling for a lay audience. -->

---

# Limitations and Critique

**1. The overfitting immunity claim is unsubstantiated.** The introduction claims enhanced immunity to overfitting as a motivation, but no experiment in the paper validates this. No train/test generalisation curves are shown, and no comparison between EDL and standard regularisation techniques is made. This is the most significant unverified claim.

**2. No ablation on the KL divergence term.** It would be informative to see whether removing the regularisation term leads to evidence collapse — the model generating large, indiscriminate evidence — or to degraded calibration. The paper offers no data on this.

**3. Theoretical derivations are sparse.** The paper states that the belief mass and uncertainty formulas follow from Subjective Logic but does not derive them. Readers unfamiliar with DST or Subjective Logic are expected to trust the result. A self-contained derivation, even in an appendix, would have strengthened the paper.

**4. The choice of sum-of-squares loss is empirical.** The paper reports that Type II MLE and cross-entropy Bayes risk "generate excessively high belief masses" and exhibit "relatively less stable performance," but no quantitative comparison is provided. The theoretical investigation is explicitly deferred to future work.

---

# Conclusion

Evidential Deep Learning is a principled and practical contribution to uncertainty quantification in classification. The core idea is compact: predict evidence rather than probabilities, place a Dirichlet over class probability vectors, and use total evidence as an inverse proxy for uncertainty. The method requires only a minor architectural change — swap softmax for ReLU — and adds no inference-time overhead relative to a standard deterministic network.

Its primary contribution is not better raw accuracy, but better behaviour when the model should be unsure: on out-of-distribution inputs, it correctly approaches maximum entropy; on adversarial examples, it correctly signals high uncertainty rather than maintaining false confidence. The connection to Subjective Logic provides a well-grounded theoretical interpretation that goes beyond empirical heuristics.

The main gaps are the unsubstantiated overfitting claim and the absence of ablation studies. These leave some open questions about when and why the method works, which subsequent work has begun to address. As a foundation, the paper is strong and the method is easy to build on.

---

# References

1. Sensoy, M., Kaplan, L., & Kandemir, M. (2018). Evidential Deep Learning to Quantify Classification Uncertainty. *NeurIPS 2018*. [arXiv:1806.01768](https://arxiv.org/abs/1806.01768)
2. Josang, A. (2016). *Subjective Logic: A Formalism for Reasoning Under Uncertainty*. Springer.
3. Dempster, A. P. (1968). A Generalization of Bayesian Inference. *Journal of the Royal Statistical Society: Series B*.
4. Gal, Y., & Ghahramani, Z. (2016). Dropout as a Bayesian Approximation: Representing Model Uncertainty in Deep Learning. *ICML 2016*.
5. Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). On Calibration of Modern Neural Networks. *ICML 2017*.
6. Lakshminarayanan, B., Pritzel, A., & Blundell, C. (2017). Simple and Scalable Predictive Uncertainty Estimation using Deep Ensembles. *NeurIPS 2017*.
7. Louizos, C., & Welling, M. (2017). Multiplicative Normalizing Flows for Variational Bayesian Neural Networks. *ICML 2017*.
8. Goodfellow, I. J., Shlens, J., & Szegedy, C. (2014). Explaining and Harnessing Adversarial Examples. *arXiv:1412.6572*.
9. Obermeyer, Z., & Emanuel, E. J. (2016). Predicting the Future — Big Data, Machine Learning, and Clinical Medicine. *NEJM*.