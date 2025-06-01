// Global dependencies (load once at init)
let model, word_index, classLabels, responses;

// Helper: pad sequences
function padSequences(sequences, maxlen = 3, padding = "post", truncating = "post") {
  return sequences.map(seq => {
    if (seq.length > maxlen) {
      return truncating === "pre" ? seq.slice(seq.length - maxlen) : seq.slice(0, maxlen);
    }
    const padded = new Array(maxlen).fill(0);
    const offset = padding === "pre" ? maxlen - seq.length : 0;
    for (let i = 0; i < seq.length; i++) padded[offset + i] = seq[i];
    return padded;
  });
}

// Init once before using prediction
async function loadResources() {
  model = await tf.loadGraphModel("http://127.0.0.1:5500/tfjs_saved_model/model.json");

  const wordIndexRes = await fetch("http://127.0.0.1:5500/tfjs_saved_model/word_index.json");
  word_index = await wordIndexRes.json();

  const contentRes = await fetch("http://127.0.0.1:5500/content.json");
  const data = await contentRes.json();

  responses = {};
  const labelSet = new Set();
  data.intents.forEach(intent => {
    responses[intent.tag] = intent.responses;
    labelSet.add(intent.tag);
  });
  classLabels = [...labelSet];
}

// Prediction function
async function predictIntent(inputText) {
  if (!model || !word_index || !classLabels || !responses) {
    await loadResources();
  }

  const cleaned = inputText.toLowerCase().replace(/[^\w\s]/gi, "");
  const sequence = cleaned.split(" ").map(w => word_index[w] || 0);
  const padded = padSequences([sequence], 3, "pre");
  const inputTensor = tf.tensor2d(padded, [1, 3]);

  const result = model.predict({ Identity: inputTensor });
  const probs = await result.softmax().data();
  const predictionIndex = probs.indexOf(Math.max(...probs));
  const predictedTag = classLabels[predictionIndex];
  const possibleResponses = responses[predictedTag] || [];
  const randomResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];

  return {
    probabilities: classLabels.map((label, i) => ({
      label,
      confidence: probs[i]
    })),
    predictedClass: predictedTag,
    confidence: probs[predictionIndex],
    response: randomResponse
  };
}
