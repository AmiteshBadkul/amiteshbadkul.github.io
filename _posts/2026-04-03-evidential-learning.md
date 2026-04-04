---
layout: post
title: Evidential Deep Learning
date: 2026-04-03 13:56:00-0400
description: A review of "Evidential Deep Learning to Quantify Classification Uncertainty" by Sensoy, Kaplan & Kandemir.
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

The fundamental need is **per-prediction uncertainty quantification**: alongside each output, the model should report how confident it actually is in that output. This makes models more reliable, more interpretable, and more appropriate for deployment in systems where incorrect predictions have real consequences. If an autonomous vehicle knows it is uncertain, if a sensor is degraded or the scenario is novel, it can hand control back to the driver rather than guess.


Uncertainty quantification in deep learning was not new in 2018, but it was largely confined to Bayesian approaches with significant computational overhead. The figure below shows the timeline of key methods, from early BNNs and Gaussian Processes through to MC Dropout and Deep Ensembles, all of which existed before EDL but required either approximate inference or multiple forward passes. Using raw softmax probabilities as a confidence proxy remained the practical default for most classification pipelines precisely because all the principled alternatives were expensive.

<div style="width:100%; overflow-x:auto; margin: 2rem 0;">
  <svg
    viewBox="0 0 860 300"
    xmlns="http://www.w3.org/2000/svg"
    style="width:100%; max-width:860px; font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
    <!-- axis -->
    <line x1="70" y1="200" x2="790" y2="200" stroke="#d7d7d7" stroke-width="1.5"/>

    <!-- year labels -->
    <text x="70"  y="226" text-anchor="middle" font-size="12" fill="#8a8a8a">2011</text>
    <text x="210" y="226" text-anchor="middle" font-size="12" fill="#8a8a8a">2013</text>
    <text x="350" y="226" text-anchor="middle" font-size="12" fill="#8a8a8a">2015</text>
    <text x="490" y="226" text-anchor="middle" font-size="12" fill="#8a8a8a">2016</text>
    <text x="710" y="226" text-anchor="middle" font-size="12" fill="#8a8a8a">2018</text>

    <!-- BNNs -->
    <circle cx="70" cy="200" r="8" fill="#b79ad6"/>
    <line x1="70" y1="192" x2="70" y2="132" stroke="#b79ad6" stroke-width="1.5" stroke-dasharray="4,4"/>
    <text x="70" y="124" text-anchor="middle" font-size="12" fill="#7f66ad" font-weight="600">BNNs</text>
    <text x="70" y="108" text-anchor="middle" font-size="10" fill="#7f7f7f">MacKay, Neal</text>

    <!-- Deep GPs -->
    <circle cx="210" cy="200" r="8" fill="#8db7df"/>
    <line x1="210" y1="192" x2="210" y2="132" stroke="#8db7df" stroke-width="1.5" stroke-dasharray="4,4"/>
    <text x="210" y="124" text-anchor="middle" font-size="12" fill="#5f8fbc" font-weight="600">Deep GPs</text>
    <text x="210" y="108" text-anchor="middle" font-size="10" fill="#7f7f7f">2013</text>

    <!-- Bayes by Backprop -->
    <circle cx="350" cy="200" r="8" fill="#8fc8a9"/>
    <line x1="350" y1="192" x2="350" y2="132" stroke="#8fc8a9" stroke-width="1.5" stroke-dasharray="4,4"/>
    <text x="350" y="124" text-anchor="middle" font-size="12" fill="#5d9a78" font-weight="600">Bayes by Backprop</text>
    <text x="350" y="108" text-anchor="middle" font-size="10" fill="#7f7f7f">2015</text>

    <!-- MC Dropout -->
    <circle cx="490" cy="200" r="8" fill="#e6b483"/>
    <line x1="490" y1="192" x2="490" y2="132" stroke="#e6b483" stroke-width="1.5" stroke-dasharray="4,4"/>
    <text x="490" y="124" text-anchor="middle" font-size="12" fill="#c48745" font-weight="600">MC Dropout</text>
    <text x="490" y="108" text-anchor="middle" font-size="10" fill="#7f7f7f">2016</text>

    <!-- EDL -->
    <circle cx="710" cy="200" r="10" fill="#7db9c4"/>
    <line x1="710" y1="190" x2="710" y2="140" stroke="#7db9c4" stroke-width="2"/>
    <text x="710" y="130" text-anchor="middle" font-size="13" fill="#4d8f9a" font-weight="700">EDL (this paper)</text>
    <text x="710" y="112" text-anchor="middle" font-size="10" fill="#7f7f7f">NeurIPS 2018</text>

    <!-- bracket -->
    <line x1="70" y1="258" x2="490" y2="258" stroke="#d7d7d7" stroke-width="1.2"/>
    <line x1="70" y1="252" x2="70" y2="264" stroke="#d7d7d7" stroke-width="1.2"/>
    <line x1="490" y1="252" x2="490" y2="264" stroke="#d7d7d7" stroke-width="1.2"/>

    <text x="280" y="280" text-anchor="middle" font-size="11" fill="#9a9a9a" font-style="italic">
      Prior methods often require expensive inference or multiple forward passes
    </text>
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
      "I predict class A with 80% probability, but this estimate is highly uncertain,  treat it with caution."
    </p>
  </div>

</div>
Softmax cannot make this distinction. It provides a **first-order** probability, a point estimate on the simplex but no **second-order** information about the reliability of that point estimate. This miscalibration problem is well-studied. Guo et al. (2017) [Calibration of Modern Neural Networks] provide an in-depth empirical analysis and are worth reading alongside this paper.

---

# Why Not Bayesian Neural Networks?

A natural response to the calibration problem is Bayesian Neural Networks (BNNs). Rather than learning a single set of weights $$\theta$$, BNNs place a prior distribution over the weights and infer the posterior $$p(\theta \mid \mathcal{D})$$ after observing data. Predictions are then made by marginalizing over the weight posterior:

$$p(y^* \mid x^*, \mathcal{D}) = \int p(y^* \mid x^*, \theta) \, p(\theta \mid \mathcal{D}) \, d\theta$$

The variance of this **posterior predictive distribution** captures epistemic uncertainty, the uncertainty arising from limited data rather than from irreducible noise in the labels.

The problem is that this integral is intractable for deep networks. In practice, BNNs approximate it using Monte Carlo sampling (e.g., running the network multiple times with dropout active and treating the variation in outputs as a proxy for uncertainty,  as in Gal & Ghahramani, 2016). Methods such as MC Dropout provide a practical approximation to predictive uncertainty, but they do not recover the full Bayesian posterior exactly and can misestimate uncertainty under distribution shift. Methods such as deep ensembles are computationally expensive, and don't scale well. Gaussian Processes (GPs) offer a non-parametric alternative with closed-form uncertainty estimates, but they do not scale to the input dimensionalities typical of image or language data without significant approximation that affects the performance.

EDL takes a different route entirely. Rather than inferring a distribution over weights and propagating it through the network, it directly outputs a distribution over possible class probability vectors, a Dirichlet distribution, from a single deterministic forward pass.

---

# Proposed Solution: Evidential Deep Learning

Sensoy et al. draw on the **Theory of Subjective Logic** [Josang, 2016], which is itself a formalization of the **Dempster-Shafer Theory of Evidence (DST)** [Dempster, 1968] using probability distributions. The full mathematical background is outside the scope of this post, the authors too don't explore these foundations as part of their paper, but the core idea is this:

Classical probability requires your belief to be fully distributed across the known hypotheses. DST relaxes this. It allows you to assign belief mass to *sets* of hypotheses, including the entire set, which is a formal way of saying *"I do not know which of these is true."* Subjective Logic borrows this using Dirichlet distributions, and EDL is the deep learning adaptation.

The key architectural change relative to a standard classifier is minimal:

<div style="margin: 1.75rem 0; padding: 1rem 1.1rem; border-left: 5px solid #b78bd0; background: #faf7fc; border-radius: 8px;">
  <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #8a63a8; margin-bottom: 0.45rem;">
    Important
  </div>
  <div style="font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 1.05rem; line-height: 1.6; color: #222;">
    Replace the softmax output layer with a nonnegative evidence-producing activation, such as ReLU.
  </div>
</div>

The non-negative outputs of this layer are interpreted as an **evidence vector** $$e = [e_1, \ldots, e_K]$$, where $$e_k \geq 0$$ is the evidence the network has collected in favour of class $$k$$. The Dirichlet parameters are then:

$$\alpha_k = e_k + 1$$

So when the network has collected zero evidence for all classes (completely uncertain), all $$\alpha_k = 1$$, giving the uniform Dirichlet, the "I do not know" state. As evidence accumulates, the Dirichlet concentrates around a particular class assignment.

<!--- Suggested figure: a 3D simplex showing (1) softmax as a single point on the simplex, and (2) the Dirichlet as a distribution over the simplex, visualised as a density. This would make the "factory of point estimates" idea concrete. -->
<figure style="margin: 2rem 0; text-align: center;">
  <img
    src="/assets/img/edl/simplex_compare.png"
    alt="Softmax as a point estimate vs EDL as a distribution over the simplex"
    style="width:100%; max-width:700px; border-radius:8px;"
  />
  <figcaption style="font-size:0.88rem; color:#666; margin-top:0.6rem;">
    A geometric view of first-order versus second-order uncertainty. Softmax returns 
    one probability vector, a single point on the simplex. EDL places a Dirichlet 
    distribution over possible probability vectors, expressing uncertainty over the 
    simplex itself.
  </figcaption>
</figure>

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

Note that $$\hat{p}_k$$ is the EDL analog of the softmax output. For in-distribution inputs, these plays a role analogous to softmax output. The important addition is $$S$$: a large $$S$$ means the Dirichlet is sharply concentrated and $$\hat{p}_k$$ is reliable; a small $$S$$ (close to $$K$$) means the model has little evidence and the predicted probability should not be trusted.

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

<figure style="margin: 2.25rem 0; width: 100%;">
  <div style="
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  ">
    <!-- Left panel -->
    <div style="display:flex; flex-direction:column; gap:0.8rem;">
      <img
        src="assests/img/edl/cls_probs.png"
        alt="Softmax classification probabilities for rotated digit 1 across rotation angles"
        style="width:100%; height:auto; display:block; border:1px solid #e5e7eb; border-radius:10px; background:#fff;"
      />
      <img
        src="assests/img/edl/rotating.png"
        alt="Sequence of rotated digit 1 images"
        style="width:100%; height:auto; display:block; border:1px solid #e5e7eb; border-radius:10px; background:#fff;"
      />
      <div style="
        font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 0.96rem;
        line-height: 1.55;
        color: #444;
      ">
        <strong>Left:</strong> Standard softmax probabilities stay highly confident even when the rotated digit becomes ambiguous or is misclassified.
      </div>
    </div>

    <!-- Right panel -->
    <div style="display:flex; flex-direction:column; gap:0.8rem;">
      <img
        src="/assests/img/edl/cls_probs_dir.png"
        alt="Evidential deep learning probabilities and uncertainty for rotated digit 1 across rotation angles"
        style="width:100%; height:auto; display:block; border:1px solid #e5e7eb; border-radius:10px; background:#fff;"
      />
      <img
        src="/assests/img/edl/rotating_dir.png"
        alt="Sequence of rotated digit 1 images"
        style="width:100%; height:auto; display:block; border:1px solid #e5e7eb; border-radius:10px; background:#fff;"
      />
      <div style="
        font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 0.96rem;
        line-height: 1.55;
        color: #444;
      ">
        <strong>Right:</strong> EDL keeps class probabilities modest and raises uncertainty sharply once the input moves away from the familiar training regime.
      </div>
    </div>
  </div>

  <figcaption style="
    margin-top: 1rem;
    font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 0.95rem;
    line-height: 1.65;
    color: #555;
  ">
    <strong>Figure 1.</strong> Classification of a rotated digit <em>1</em> as the rotation angle varies from 0° to 180°. 
    The softmax model on the left remains overconfident on incorrect classes, whereas the evidential model on the right explicitly increases uncertainty under rotation.
  </figcaption>
</figure>

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
2. Josang, A. (2016). [Subjective Logic: A Formalism for Reasoning Under Uncertainty](https://link.springer.com/book/10.1007/978-3-319-42337-1). Springer.
3. Dempster, A. P. (1968). A Generalization of Bayesian Inference. *Journal of the Royal Statistical Society: Series B*.
4. Gal, Y., & Ghahramani, Z. (2016). [Dropout as a Bayesian Approximation: Representing Model Uncertainty in Deep Learning](https://proceedings.mlr.press/v48/gal16.html). *ICML 2016*.
5. Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). [On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html). *ICML 2017*.
6. Lakshminarayanan, B., Pritzel, A., & Blundell, C. (2017). [Simple and Scalable Predictive Uncertainty Estimation using Deep Ensembles](https://proceedings.neurips.cc/paper_files/paper/2017/hash/9ef2ed4b7fd2c810847ffa5fa85bce38-Abstract.html). *NeurIPS 2017*.
7. Louizos, C., & Welling, M. (2017). [Multiplicative Normalizing Flows for Variational Bayesian Neural Networks](https://proceedings.mlr.press/v70/louizos17a.html). *ICML 2017*.
8. Goodfellow, I. J., Shlens, J., & Szegedy, C. (2014). [Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572). *arXiv:1412.6572*.
9. Obermeyer, Z., & Emanuel, E. J. (2016). [Predicting the Future — Big Data, Machine Learning, and Clinical Medicine](https://www.nejm.org/doi/abs/10.1056/NEJMp1606181). *NEJM*.