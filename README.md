# Support Search Lab
[Open the demo](https://lushadowx.github.io/support-search-lab/) · [Original support agent](https://github.com/LuShadowX/ai-support-agent)

Compare BM25 with a compact static embedding model over the same 16 passages. Type a store question to see each ranker's top three source passages. Search runs in your browser after the model downloads. No API key or generation step.

## Evaluation
The 27 manually labelled English queries cover returns, delivery, payments, product details and care. Each has one intended passage. The questions and target IDs were specified before running the comparison. Both rankers use the heading and body of each passage.

| Ranker | Correct at rank 1 | Correct in top 3 |
|---|---:|---:|
| BM25 | 12/27 | 18/27 |
| Model2Vec cosine | 21/27 | 27/27 |

These are small, synthetic in-domain results. They measure retrieval, not answer quality or performance on customer traffic. See [per-query ranks](data/results.json); zero means the labelled passage fell outside the returned list.

## Reproduce
Run `node scripts/evaluate.mjs` from the repository root. To open the app locally run `python3 -m http.server 8000` and visit http://localhost:8000.

BM25 uses k1=1.2 and b=0.75. The semantic ranker uses greedy English WordPiece tokenization, sums dequantized token embeddings, normalizes each vector and ranks by cosine similarity. It skips unrecognized words. Both return up to three positive-scoring passages. The model is static and can confuse word order or negation.

## Sources
The three [support documents](https://github.com/LuShadowX/ai-support-agent/tree/d2be9376d710b37a9658ca8090f6eebf7fa367a1/data/docs) are a snapshot of the agent's demo corpus. Each level-two heading starts a passage. This project benchmarks retrieval separately from the agent's chat and action endpoints.

The bundled vectors derive from [minishlab/potion-base-8M](https://huggingface.co/minishlab/potion-base-8M/tree/bf8b056651a2c21b8d2565580b8569da283cab23), under the MIT license in model/LICENSE. To rebuild, download that snapshot, install NumPy, and run `python scripts/prepare.py PATH_TO_SNAPSHOT`. The exporter stores one int8 row and one float scale per vocabulary entry.
