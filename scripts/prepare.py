"""Convert the pinned Model2Vec snapshot into a browser-readable int8 table."""
import json
import struct
import sys
from pathlib import Path

import numpy as np

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'model'
with (source / 'model.safetensors').open('rb') as f:
    header = json.loads(f.read(struct.unpack('<Q', f.read(8))[0]))
    tensor = header['embeddings']
    assert tensor['dtype'] == 'F32' and tensor['data_offsets'][0] == 0
    weights = np.frombuffer(f.read(), dtype='<f4').reshape(tensor['shape'])
scale = np.maximum(np.abs(weights).max(axis=1), 1e-12) / 127
np.rint(weights / scale[:, None]).astype('int8').tofile(output / 'vectors.bin')
scale.astype('<f4').tofile(output / 'scales.bin')
tokenizer = json.loads((source / 'tokenizer.json').read_text())
(output / 'vocab.json').write_text(json.dumps(tokenizer['model']['vocab']))
