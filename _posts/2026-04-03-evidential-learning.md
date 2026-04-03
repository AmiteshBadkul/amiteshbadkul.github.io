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

This post is my review of **"Evidential Deep Learning to Quantify Classification Uncertainty"** by Murat Sensoy, Lance Kaplan, and Melih Kandemir. The paper proposes a principled approach to uncertainty quantification in classification, grounded in the Dempster-Shafer Theory of Evidence. I have tried to write this in a way that is accessible but does not shy away from the math.

---

# The Problem

Deep learning models have achieved remarkable accuracy across a wide range of tasks, but accuracy alone is not sufficient for deployment in the real world. A critical flaw persists: these models are severely overconfident. Every prediction comes wrapped in high confidence, regardless of whether the input is familiar or completely outside anything the model has seen before.

For low-stakes tasks such as classifying cats versus dogs, tagging social media images, this is tolerable. However, consider the following:

- **Autonomous driving:** Multiple high-profile failures have been linked to ML systems that were confidently wrong. A Tesla Autopilot fatality in 2016 occurred when the system misclassified a white truck as sky [[NTSB report](https://www.ntsb.gov/investigations/Pages/HWY16FH018.aspx)]. Confidence without calibration is dangerous.
- **Medical diagnosis:** ML-assisted diagnostic tools that assign inflated confidence to incorrect predictions can mislead clinicians, particularly in edge cases or underrepresented populations [[Obermeyer & Emanuel, 2016](https://www.nejm.org/doi/full/10.1056/NEJMp1606181)].
- **Drug discovery:** Molecular property prediction models that cannot flag their own uncertainty may wastefully prioritize compounds unlikely to succeed in wet-lab validation.

The fundamental need is **per-prediction uncertainty quantification**: alongside each output, the model should report how confident it actually is in that output. This makes models more reliable, more interpretable, and more appropriate for deployment in systems where incorrect predictions have real consequences. If an autonomous vehicle knows it is uncertain, due a sensor is degraded or the scenario is novel, it can hand control back to the driver rather than guess.


Uncertainty quantification in deep learning was not new in 2018, but it was largely confined to Bayesian approaches with significant computational overhead. The figure below shows the timeline of key methods, from early BNNs and Gaussian Processes through to MC Dropout and Deep Ensembles, all of which existed before EDL but required either approximate inference or multiple forward passes. Using raw softmax probabilities as a confidence proxy remained the practical default for most classification pipelines precisely because all the principled alternatives were expensive.

<div style="width:100%; overflow-x:auto; margin: 2rem 0;">
<svg viewBox="0 0 860 300" xmlns="http://www.w3.org/2000/svg" 
     font-family="Georgia, serif" style="width:100%; max-width:860px;">
  <!-- axis -->
  <line x1="60" y1="200" x2="820" y2="200" stroke="#ccc" stroke-width="1.5"/>
  <!-- year labels -->
  <text x="60"  y="225" text-anchor="middle" font-size="12" fill="#888">2011</text>
  <text x="190" y="225" text-anchor="middle" font-size="12" fill="#888">2013</text>
  <text x="320" y="225" text-anchor="middle" font-size="12" fill="#888">2015</text>
  <text x="450" y="225" text-anchor="middle" font-size="12" fill="#888">2016</text>
  <text x="580" y="225" text-anchor="middle" font-size="12" fill="#888">2017</text>
  <text x="740" y="225" text-anchor="middle" font-size="12" fill="#888">2018</text>
  <!-- events -->
  <!-- BNNs -->
  <circle cx="60" cy="200" r="7" fill="#9b59b6"/>
  <line x1="60" y1="193" x2="60" y2="130" stroke="#9b59b6" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="60" y="125" text-anchor="middle" font-size="11" fill="#9b59b6" font-weight="bold">BNNs</text>
  <text x="60" y="112" text-anchor="middle" font-size="10" fill="#666">(MacKay 1992,</text>
  <text x="60" y="100" text-anchor="middle" font-size="10" fill="#666">Neal 1996)</text>
  <!-- GPs -->
  <circle cx="190" cy="200" r="7" fill="#2980b9"/>
  <line x1="190" y1="193" x2="190" y2="145" stroke="#2980b9" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="190" y="140" text-anchor="middle" font-size="11" fill="#2980b9" font-weight="bold">Deep GPs</text>
  <text x="190" y="128" text-anchor="middle" font-size="10" fill="#666">(Damianou &amp;</text>
  <text x="190" y="116" text-anchor="middle" font-size="10" fill="#666">Lawrence 2013)</text>
  <!-- Bayes by Backprop -->
  <circle cx="320" cy="200" r="7" fill="#27ae60"/>
  <line x1="320" y1="193" x2="320" y2="130" stroke="#27ae60" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="320" y="125" text-anchor="middle" font-size="11" fill="#27ae60" font-weight="bold">Bayes by Backprop</text>
  <text x="320" y="112" text-anchor="middle" font-size="10" fill="#666">(Blundell et al.</text>
  <text x="320" y="100" text-anchor="middle" font-size="10" fill="#666">2015)</text>
  <!-- MC Dropout -->
  <circle cx="450" cy="200" r="7" fill="#e67e22"/>
  <line x1="450" y1="193" x2="450" y2="145" stroke="#e67e22" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="450" y="140" text-anchor="middle" font-size="11" fill="#e67e22" font-weight="bold">MC Dropout</text>
  <text x="450" y="128" text-anchor="middle" font-size="10" fill="#666">(Gal &amp; Ghahramani</text>
  <text x="450" y="116" text-anchor="middle" font-size="10" fill="#666">2016)</text>
  <!-- Calibration -->
  <circle cx="580" cy="200" r="7" fill="#c0392b"/>
  <line x1="580" y1="193" x2="580" y2="130" stroke="#c0392b" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="580" y="125" text-anchor="middle" font-size="11" fill="#c0392b" font-weight="bold">Calibration + Ensembles</text>
  <text x="580" y="112" text-anchor="middle" font-size="10" fill="#666">(Guo 2017,</text>
  <text x="580" y="100" text-anchor="middle" font-size="10" fill="#666">Lakshminarayanan 2017)</text>
  <!-- EDL -->
  <circle cx="740" cy="200" r="9" fill="#1a7a8a"/>
  <line x1="740" y1="191" x2="740" y2="145" stroke="#1a7a8a" stroke-width="2"/>
  <text x="740" y="140" text-anchor="middle" font-size="12" fill="#1a7a8a" font-weight="bold">EDL (this paper)</text>
  <text x="740" y="128" text-anchor="middle" font-size="10" fill="#666">(Sensoy et al.</text>
  <text x="740" y="116" text-anchor="middle" font-size="10" fill="#666">NeurIPS 2018)</text>
  <!-- bracket label -->
  <text x="440" y="270" text-anchor="middle" font-size="11" fill="#aaa" font-style="italic">
    All prior methods: expensive inference or multiple forward passes
  </text>
  <line x1="60" y1="257" x2="580" y2="257" stroke="#ccc" stroke-width="1"/>
  <line x1="60" y1="252" x2="60" y2="262" stroke="#ccc" stroke-width="1"/>
  <line x1="580" y1="252" x2="580" y2="262" stroke="#ccc" stroke-width="1"/>
</svg>
</div>

---

# Issues with Softmax

The standard classification pipeline converts raw neural network outputs $$f_k(x, \theta)$$ into class probabilities using the softmax function:

$$\sigma(f_k) = \frac{e^{f_k}}{\sum_{j=1}^{K} e^{f_j}}$$

This has a structural limitation: the outputs always sum to one. The model is forced to distribute its belief across the known classes, no matter what input it receives. Feed a trained cat-versus-dog classifier an image of a horse, and it will return something like [0.70 dog, 0.30 cat]. There is no mechanism to say *"I have never seen anything like this"*,  the probabilities must fill the simplex.

This creates two related problems.

**First, overconfidence on out-of-distribution inputs.** Because the exponentiation in softmax amplifies the largest logit, the predicted class almost always receives disproportionately high probability. For example, the authors show that the LeNet model trained on MNIST dataset when tested with an input digit rotated by 90 degrees, causes LeNet to misclassify it with high softmax confidence. The model does not know what it does not know.

**Second, conflation of probability with confidence.** A softmax output of 0.80 for class A tells you the model's best estimate of P(class = A). It says nothing about how trustworthy that estimate is. What we actually want is a system that can distinguish between two very different situations:

<div style="display:flex; gap:1.2rem; margin: 1.5rem 0; flex-wrap: wrap;">

  <div style="flex:1; min-width:260px; border-left: 3px solid var(--global-theme-color); 
              padding: 0.8rem 1.2rem; background: var(--global-bg-color); 
              border-radius: 0 6px 6px 0;">
    <p style="margin:0; font-style:italic; color: var(--global-text-color);">
      "I predict class A with 80% probability, and I am confident in this estimate."
    </p>
  </div>

  <div style="flex:1; min-width:260px; border-left: 3px solid #aaa; 
              padding: 0.8rem 1.2rem; background: var(--global-bg-color); 
              border-radius: 0 6px 6px 0; opacity: 0.75;">
    <p style="margin:0; font-style:italic; color: var(--global-text-color);">
      "I predict class A with 80% probability, but this estimate is highly uncertain,  treat it with scepticism."
    </p>
  </div>

</div>
Softmax cannot make this distinction. It provides a **first-order** probability, a point estimate on the simplex but no **second-order** information about the reliability of that point estimate. This miscalibration problem is well-studied. Guo et al. (2017) [Calibration of Modern Neural Networks] provide an in-depth empirical analysis and are worth reading alongside this paper.

---

# Why Not Bayesian Neural Networks?

A natural response to the calibration problem is Bayesian Neural Networks (BNNs). Rather than learning a single set of weights $$\theta$$, BNNs place a prior distribution over the weights and infer the posterior $$p(\theta \mid \mathcal{D})$$ after observing data. Predictions are then made by marginalizing over the weight posterior:

$$p(y^* \mid x^*, \mathcal{D}) = \int p(y^* \mid x^*, \theta) \, p(\theta \mid \mathcal{D}) \, d\theta$$

The variance of this **posterior predictive distribution** captures epistemic uncertainty, the uncertainty arising from limited data rather than from irreducible noise in the labels.

The problem is that this integral is intractable for deep networks. In practice, BNNs approximate it using Monte Carlo sampling (e.g., running the network multiple times with dropout active and treating the variation in outputs as a proxy for uncertainty,  as in Gal & Ghahramani, 2016). This method is a crude approximation of the models' true uncertainty [find a paper which proves this]. Methods such as deep ensembles are computationally expensive, and don't scale well. Gaussian Processes (GPs) offer a non-parametric alternative with closed-form uncertainty estimates, but they do not scale to the input dimensionalities typical of image or language data without significant approximation that affects the performance.

EDL takes a different route entirely. Rather than inferring a distribution over weights and propagating it through the network, it directly outputs a distribution over possible class probability vectors, a Dirichlet distribution, from a single deterministic forward pass.

---

# Proposed Solution: Evidential Deep Learning

Sensoy et al. draw on the **Theory of Subjective Logic** [Josang, 2016], which is itself a formalization of the **Dempster-Shafer Theory of Evidence (DST)** [Dempster, 1968] using probability distributions. The full mathematical background is outside the scope of this post, the authors too don't explore these foundations as part of their paper, but the core idea is this:

Classical probability requires your belief to be fully distributed across the known hypotheses. DST relaxes this. It allows you to assign belief mass to *sets* of hypotheses, including the entire set, which is a formal way of saying *"I do not know which of these is true."* Subjective Logic operationalizes this using Dirichlet distributions, and EDL is the deep learning adaptation.

The key architectural change relative to a standard classifier is minimal:

> **Replace the softmax output layer with a ReLU activation.**

The non-negative outputs of this layer are interpreted as an **evidence vector** $$e = [e_1, \ldots, e_K]$$, where $$e_k \geq 0$$ is the evidence the network has collected in favour of class $$k$$. The Dirichlet parameters are then:

$$\alpha_k = e_k + 1$$

So when the network has collected zero evidence for all classes (completely uncertain), all $$\alpha_k = 1$$, giving the uniform Dirichlet, the "I do not know" state. As evidence accumulates, the Dirichlet concentrates around a particular class assignment.

<!--- Suggested figure: a 3D simplex showing (1) softmax as a single point on the simplex, and (2) the Dirichlet as a distribution over the simplex, visualised as a density. This would make the "factory of point estimates" idea concrete. -->

---

## The Math

The key quantities in the framework are:

<div class="table-responsive" style="margin: 1.5rem 0;">
<table class="table table-sm" style="font-size: 0.9rem; border-collapse: separate; border-spacing: 0;">
  <thead>
    <tr style="border-bottom: 2px solid var(--global-theme-color);">
      <th style="padding: 0.6rem 1rem; color: var(--global-theme-color); 
                 font-weight: 600; border:none;">Quantity</th>
      <th style="padding: 0.6rem 1rem; color: var(--global-theme-color); 
                 font-weight: 600; border:none;">Formula</th>
      <th style="padding: 0.6rem 1rem; color: var(--global-theme-color); 
                 font-weight: 600; border:none;">Interpretation</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid var(--global-divider-color);">
      <td style="padding: 0.6rem 1rem; border:none;">Dirichlet strength</td>
      <td style="padding: 0.6rem 1rem; border:none;">\(S = \sum_{k=1}^{K} \alpha_k\)</td>
      <td style="padding: 0.6rem 1rem; border:none; color: #666;">Total evidence across all classes</td>
    </tr>
    <tr style="background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--global-divider-color);">
      <td style="padding: 0.6rem 1rem; border:none;">Expected class probability</td>
      <td style="padding: 0.6rem 1rem; border:none;">\(\hat{p}_k = \alpha_k / S\)</td>
      <td style="padding: 0.6rem 1rem; border:none; color: #666;">Analogous to softmax output</td>
    </tr>
    <tr style="border-bottom: 1px solid var(--global-divider-color);">
      <td style="padding: 0.6rem 1rem; border:none;">Belief mass (class k)</td>
      <td style="padding: 0.6rem 1rem; border:none;">\(b_k = e_k / S = (\alpha_k - 1)/S\)</td>
      <td style="padding: 0.6rem 1rem; border:none; color: #666;">Confidence attributed to class k specifically</td>
    </tr>
    <tr style="background: rgba(0,0,0,0.02);">
      <td style="padding: 0.6rem 1rem; border:none;">Uncertainty mass</td>
      <td style="padding: 0.6rem 1rem; border:none;">\(u = K / S\)</td>
      <td style="padding: 0.6rem 1rem; border:none; color: #666;">Global uncertainty; inversely proportional to evidence</td>
    </tr>
  </tbody>
</table>
<p style="font-size:0.85rem; color:#888; margin-top: 0.5rem;">
The constraint \(u + \sum_k b_k = 1\) always holds. When evidence is zero, 
\(S = K\), so \(u = 1\) — total uncertainty. As evidence grows, \(S\) grows, 
\(u\) shrinks, and belief masses increase.
</p>
</div>

The constraint $$u + \sum_{k} b_k = 1$$ always holds. When evidence is zero for all classes, $$S = K$$, so $$u = 1$$, total uncertainty. As evidence grows, $$S$$ grows, $$u$$ shrinks, and the belief masses increase.

Note that $$\hat{p}_k$$ is the EDL analog of the softmax output. For in-distribution inputs, these should roughly agree with softmax probabilities. The important addition is $$S$$: a large $$S$$ means the Dirichlet is sharply concentrated and $$\hat{p}_k$$ is reliable; a small $$S$$ (close to $$K$$) means the model has little evidence and the predicted probability should not be trusted.

---

## Loss Function

The paper considers three loss formulations and settles on the **sum-of-squares Bayes risk**, which has a clean decomposition:

$$\mathcal{L}_i(\Theta) = \sum_{j=1}^{K} \underbrace{(y_{ij} - \hat{p}_{ij})^2}_{\text{prediction error}} + \underbrace{\frac{\hat{p}_{ij}(1 - \hat{p}_{ij})}{S_i + 1}}_{\text{variance}}$$

The first term drives the mean of the Dirichlet toward the true label. The second term penalizes high variance in the Dirichlet, which shrinks as evidence grows, the model is rewarded for being confident *when it is right*. Proposition 1 in the paper guarantees that the variance term is always smaller than the prediction error term, ensuring data fit is always the priority.

On top of this, a **KL divergence regularisation term** is added:

$$\mathcal{L}(\Theta) = \sum_{i=1}^{N} \mathcal{L}_i(\Theta) + \lambda_t \sum_{i=1}^{N} \text{KL}\left[D(p_i \mid \tilde{\alpha}_i) \,\|\, D(p_i \mid \mathbf{1})\right]$$

where $$\tilde{\alpha}_i$$ is the Dirichlet parameter vector after zeroing out the evidence for the correct class, $$D(p \mid \mathbf{1})$$ is the uniform Dirichlet ("I do not know"), and $$\lambda_t = \min(1.0,\, t/10)$$ is an annealing coefficient that increases over the first 10 training epochs.

The role of this term is specific: it penalises the model for maintaining evidence on *incorrect* classes when that evidence does not contribute to data fit. It does not teach the model to always say "I do not know", it teaches the model to *not be confidently wrong*. The annealing ensures the model has freedom to explore early in training before being regularised toward the uniform distribution on misfits.

One notable gap: the paper does not include an ablation study showing what happens when this term is removed. This would have been informative.

---

## Why Dirichlet?

A Dirichlet distribution is a probability distribution *over* probability vectors, it lives naturally on the simplex, which is precisely where class probability vectors live. Where softmax gives you a single point on the simplex, the Dirichlet gives you a distribution over it. In the authors' words, it is a "factory of point estimates", each sample from the Dirichlet is one possible softmax-like output, and the distribution over samples captures how uncertain the model is about which output is correct.

Three concrete reasons Dirichlet is the right choice here:

1. **Conjugacy.** The Dirichlet is the conjugate prior for the categorical and multinomial distributions. When new evidence arrives, updating the Dirichlet is as simple as incrementing the relevant $$\alpha_k$$. This gives the framework a clean Bayesian interpretation.
2. **Domain match.** Dirichlet is defined on the simplex $$\mathcal{S}_K$$, exactly the domain of valid class probability vectors.
3. **Interpretability.** The parameters $$\alpha_k$$ behave as pseudo-counts of evidence. $$\alpha_k = 1$$ means zero evidence for class $$k$$; higher values mean accumulated support. This maps cleanly onto the evidential reasoning framework.

---

# Experimental Setup and Results

The paper evaluates against standard deterministic networks (L2 regularised), MC Dropout, Deep Ensembles, and several Bayesian variational inference methods (FFGU, FFLU, MNFG), all using the same LeNet architecture for fairness.

Three evaluation axes are used:

**1. Standard classification accuracy.** EDL is competitive with all baselines on both MNIST (99.3%) and CIFAR5 (83%), confirming that the uncertainty extensions do not hurt raw predictive performance. The claim is not that EDL is more accurate, but that it is equally accurate while being better calibrated.

**2. Out-of-distribution detection.** Models are trained on MNIST and evaluated on notMNIST (letters, not digits). We expect predictions to have maximum entropy, the model should be uncertain about everything it has never seen. Figure 3 (left) shows empirical CDFs of prediction entropy across all test inputs. The ideal curve hugs the bottom-right corner: most predictions have high entropy, meaning the model correctly admits it does not know. EDL's curve is closest to this ideal. The baselines rise earlier, indicating they assign low entropy (high confidence) to out-of-distribution inputs. The same experiment is repeated for CIFAR10: training on five categories and testing on the held-out five. Results are consistent.

**3. Adversarial robustness.** Adversarial examples are generated using the Fast Gradient Sign Method (FGSM) at varying perturbation magnitudes $$\epsilon$$. Figure 4 shows accuracy and entropy as functions of $$\epsilon$$. Dropout achieves the highest adversarial accuracy but is overconfident on its wrong predictions, it assigns low entropy even when $$\epsilon$$ is large. EDL sacrifices some adversarial accuracy relative to Dropout, but its entropy rises appropriately as $$\epsilon$$ increases: it knows when it is being attacked.

<!--- Suggested: include Figures 1, 3, and 4 from the paper with proper attribution (arXiv open access). Figure 1 (rotated digit) is especially compelling for a lay audience. -->

---

# Limitations and Critique

**1. The overfitting immunity claim is unsubstantiated.** The introduction claims enhanced immunity to overfitting as a motivation, but no experiment in the paper validates this. No train/test generalisation curves are shown, and no comparison between EDL and standard regularisation techniques is made. This is the most significant unverified claim.

**2. No ablation on the KL divergence term.** It would be informative to see whether removing the regularisation term leads to evidence collapse, the model generating large, indiscriminate evidence or to degraded calibration. The paper offers no data on this.

**3. The choice of sum-of-squares loss is empirical.** The paper reports that Type II MLE and cross-entropy Bayes risk "generate excessively high belief masses" and exhibit "relatively less stable performance," but no quantitative comparison is provided. The theoretical investigation is explicitly deferred to future work.

---

# Conclusion

Evidential Deep Learning is a principled and practical contribution to uncertainty quantification in classification. The core idea is compact: predict evidence rather than probabilities, place a Dirichlet over class probability vectors, and use total evidence as an inverse proxy for uncertainty. The method requires only a minor architectural change, swap softmax for ReLU, and adds no inference-time overhead relative to a standard deterministic network.

Its primary contribution is not better raw accuracy, but better behaviour when the model should be unsure: on out-of-distribution inputs, it correctly approaches maximum entropy. On adversarial examples, it correctly signals high uncertainty rather than maintaining false confidence. The connection to Subjective Logic provides a well-grounded theoretical interpretation that goes beyond empirical heuristics.

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