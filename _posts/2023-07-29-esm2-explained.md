---
layout: distill
title: Evolutionary Scale Modeling using Protein Language Models
date: 2023-07-29 11:59:00-0400
description: ESM2 model explained
tags: ml dl literature
categories: literature-review
authors:
- name: Amitesh Badkul
  url: "https://amiteshbadkul.github.io"
  affiliations:
    name: BITS Pilani
    name: City University of New York

toc:
  - name: Language Models in Biological Domain
  - name: Protein Language Models
  - name: Emergence of Structural Information in ESM-2
  - name: ESMFold Architecture
  - name: Conclusions
---

## Language Models in Biological Domain

Language models like BERT have shown impressive capabilities for natural language tasks, inspiring their application to model protein sequences. These protein language models (PLMs) treat amino acid sequences analogous to sentences, with patterns reflecting structural and functional constraints. For instance, local amino acid order directly specifies secondary structure, while distal coevolving residues often contact in 3D space. Local amino acid order patterns such as helices and strands dictate the resulting local protein secondary structure. Meanwhile, amino acids distant in sequence but close spatially often coevolve by compensatory mutations to maintain structural integrity.

PLMs are commonly pretrained via objectives like masked language modeling (MLM), which trains the model to predict randomly masked tokens from context. Despite simple self-supervision, large PLMs exhibit emergent understanding of language semantics. This motivated hypothesis that pretraining PLMs on protein corpora may similarly elicit learning of sequence-structure mappings, given patterns in sequences encode structural properties. Because patterns in protein sequences inherently reflect structural constraints, pretraining large PLMs to model sequences may enable learning about the sequence-structure relationship. This could allow PLMs to infer 3D structural properties purely from sequence, despite no explicit supervision.

Critically, insights from statistical mechanics and coevolutionary sequence analysis established that proteins’ 3D shapes constrain viable amino acid substitutions over evolution. Thus structural information becomes embedded in sequence statistics. Early bioinformatics methods leveraged this to predict aspects like secondary structure or residue contacts.

Machine learning advanced contact and structure prediction. Initial methods employed convolutional or recurrent architectures. Attention mechanisms then enabled modeling long-range dependencies, improving contact prediction. Recently, large multitask networks integrating both sequence and structure data have achieved highly accurate structure prediction.

In parallel, natural language processing advanced via scaling model size and data. Self-attention-based transformers pretrained on text via MLM exhibit strong few-shot learning abilities. ProtBert first adapted BERT to proteins, showing MLM pretraining improved generalization. Subsequent PLMs including ProtT5 and ESM-1b demonstrated increasing capability to capture protein properties given sufficient scale.

Scaling up MLM pretraining on large, diverse protein corpora may thus enable PLMs to implicitly learn mappings between sequence statistics and 3D conformations. This contrasts classic template-based or homology modeling, which compares query sequences against evolutionary relatives with known structures. PLMs can potentially associate sequences across fold space by identifying commonalities in sequence patterns induced by shared structural constraints. Realizing this possibility motivates recent research on large protein LM scaling.

Overall, the convergence of statistical mechanics, coevolutionary theory, machine learning, and natural language processing over decades has laid the foundation for protein language models to potentially unlock new knowledge and capabilities as models scale. ESM-2 represents the latest innovation in this trajectory.

## Protein Language Models

Protein language models provide a new paradigm for learning representations integrating protein sequences' structural and functional signatures. The core philosophy behind PLMs recognizes that sequences inherently encode signatures of 3D structures and biochemical activities into the order and variation of amino acids. This principle underpins advances in template modeling, physics-based simulations, and machine learned structure prediction.

Despite straightforward pretraining objectives like MLM, large LMs demonstrate impressive zero-shot emergence of capabilities requiring understanding language semantics. For instance, models trained simply to fill masked words can exhibit nuanced skills like translation, summarization, and reasoning. Analogously, PLMs pretrained to predict masked amino acids from surrounding context may induce generalizable learning of sequence-structure relationships by internalizing meaningful sequence patterns.

By pretraining on large, evolutionarily diverse sequence corpora, PLMs can potentially learn structural knowledge exceeding what is extractable from single protein families. PLMs complement traditional comparative modeling, which analyzes sequence covariation within groups of homologous proteins related by evolution. Modeling sequences collectively across protein space facilitates learning about fundamental physico-chemical constraints between sequences and structures.

Recent PLMs exhibit promising capabilities for sequence-based structure prediction. For instance, models with over 10 billion parameters combined with differentiable folding heads can generate atomistic structural models from sequence alone. Some PLMs have achieved major speedups compared to previous methods while maintaining accuracy. Expanding protein sequence databases via metagenomic sequencing presents exciting opportunities for enlarging the scope of structures PLMs can effectively model.

Overall, the ability of large neural language models to exhibit emergent capabilities has inspired approaches scaling up pretraining on protein sequences. ESM-2 substantiates the potential for this strategy to yield models encoding rich structural knowledge within sequence representations. Ongoing growth in model scale and available sequences promises continued development in protein language modeling.

## Emergence of Structural Information in ESM-2
The ESM-2 model demonstrates substantial improvements in pretraining scale enables progressive emergence of protein structural properties in language model representations. Both conceptual insights into sequence-structure mappings and empirical experience with language models contributed to ESM-2’s development.

|<img src="https://imgur.com/0YIhOEp.png" width="75%" height="75%" />|
|:--:|
| *ESM-2 Model* |

Theoretical principles established proteins' 3D conformations constrain viable amino acid substitutions over evolution, embedding structural signatures within sequence statistics. This motivated pioneering bioinformatics approaches to leverage statistics for structure and function insight. Meanwhile, large neural language models, despite simple objectives like masked LM pretraining, exhibited surprising emergent capabilities requiring understanding language semantics.

ESM-2 synthesizes these perspectives. It adopts a 24-layer transformer encoder architecture, with modifications including rotary position embeddings to better model long protein sequences. ESM-2 is pretrained on 65 million unique UniRef50 sequences using masked LM, enabling the model to learn sequence patterns and their structural implications.

Analyses reveal consistent improvements in structural knowledge as ESM-2 scaling progresses from 8 million to 15 billion parameters. Both low-resolution and atomic-level structure quality metrics substantially increase with model size. Perplexity measurements also improve, confirming scaling enhances sequence representations. Critically, proteins exhibiting perplexity gains also show structure prediction gains, evidencing intimate connections between sequence modeling and structure learning. As ESM-2 scaling progressed from 8 million to 15 billion parameters, long-range contact precision increased substantially from 0.16 to 0.54 (238% relative gain). This metric measuring how accurately residue contacts can be extracted from self-attention maps improved steadily with model size. Similarly, CASP14 TM-score rose from 0.37 to 0.55 (49% relative gain), indicating atomic-level structure quality improved with scale. Perplexity declined from 10.45 to 6.37, confirming language modeling of sequences enhanced across scaling. Critically, proteins with large perplexity gains also showed large contact prediction gains (NDCG = 0.87), evidencing tight coupling between sequence modeling and structure prediction quality.

Together, these results substantiate the hypothesis that massive self-supervision on diverse protein sequences can elicit emergence of structural knowledge within sequence representations. This supports the promise of large language model pretraining for deducing 3D conformations from sequence statistics by integrating co-evolutionary signals across protein space.

The innovations of ESM-2 provide a foundation to further scale model capacity, sequence data, and compute power. Ongoing growth along these dimensions will offer insight into the limits of structural knowledge extractable purely from unsupervised sequence modeling.


## ESMFold Architecture
Building on insights from ESM-2, the ESMFold model enables fast, end-to-end protein structure prediction directly from sequence. ESMFold integrates the pretrained ESM-2 language model with a lightweight prediction head module. This simple yet powerful approach eliminates the need for homology search or complex multitask architectures.

ESM-2 provides a strong foundation, having accumulated rich structural knowledge from its masked LM pretraining. Its representations are fed into ESMFold's prediction module, which applies alternating layers of self- and pairwise attention to refine coordinate predictions. A triangular update scheme helps capture long-range dependencies, while maintaining efficiency.

This overall architecture optimizes prediction speed without sacrificing accuracy. By exploiting the compressed evolutionary signal within ESM-2, costly alignment procedures are avoided. The prediction module also eliminates much complexity from state-of-the-art pipelines. Together, these savings allow up to 60x faster inference than existing methods while achieving competitive accuracy.

ESM-2's training is critical to ESMFold's performance. Masked LM over 65+ million diverse sequences enables the language model to learn generalizable associations between sequence patterns and structural constraints. This rich pretraining endows ESMFold with single sequence prediction abilities exceeding alignment-dependent alternatives when alignments are ablated.

Furthermore, ESM-2 perplexity predicts ESMFold accuracy, since perplexity improvements imply enhanced sequence representations that provide ESMFold superior structural insight. Overall, ESMFold's design elegantly combines the power of scale with architectural
simplicity to advance protein structure prediction.

|<img src="https://imgur.com/UKcvZas.png" width="75%" height="75%" />|
|:--:|
| *ESM-2 Model Perplexity* |

The innovations of ESMFold highlight the potential for pretrained language models to accelerate structure prediction. Its speed and accuracy could expand high-quality prediction to large databases like metagenomic resources. Future work on integrating coevolutionary signals and physics-based refinement may further improve accuracy.

## Conclusions

In conclusion, ESM-2 and ESMFold demonstrate transformative potential for large language model pretraining in protein structure prediction. By pretraining on massive and diverse protein sequence corpora, representations emerge that encapsulate surprisingly detailed structural knowledge purely from sequence signals. This knowledge enables fast yet accurate end-to-end structure prediction from sequence alone.

ESM-2 establishes clear trends of improving structural understanding with greater model scale and data diversity. Ongoing expansion of sequence databases via metagenomics promises continued gains from larger pretraining resources. In tandem, architectural advances may further enhance sequence representations.

Looking forward, large language models like ESM-2 offer an exciting path to democratize structure prediction by distilling vast structural knowledge from sequences alone. Realizing this vision could accelerate discovery of new protein structures, functions, and mechanisms across biology. More broadly, scaling self-supervision may prove a general paradigm for eliciting emergence of complex reasoning abilities in artificial intelligence systems.

The insights gained from ESM-2 and ESMFold underscore both the progress enabled by scaled language model pretraining as well as the vast room for continued innovation. Expanding compute power, data, and model architectures promises to further advance protein language modeling and structure prediction into the future.

## References
1. [Evolutionary-scale prediction of atomic-level protein structure with a language model](https://www.science.org/doi/10.1126/science.ade2574)
2. [MSA Transformer](https://proceedings.mlr.press/v139/rao21a.html)
3. [Highly accurate protein structure prediction with AlphaFold](https://www.nature.com/articles/s41586-021-03819-2/)
4. [Attention is all you need](https://arxiv.org/abs/1706.03762)
5. [Language Models are Unsupervised Multitask Learners](https://www.semanticscholar.org/paper/Language-Models-are-Unsupervised-Multitask-Learners-Radford-Wu/9405cc0d6169988371b2755e573cc28650d14dfe)
6. [Direct-coupling analysis of residue coevolution captures native contacts across many protein families](https://www.pnas.org/doi/10.1073/pnas.1111471108)
