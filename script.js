// Global variables
let model;
let word_index;
const responses = {};
let classLabels;
let maxLen;
let prediction;
let isModelLoaded = false;

// Load the model, word_index, and classLabels
async function init() {
    console.log('--------- LOAD Model, Metadata, & ClassLabels ----------');
    // Memanggil model tfjs
    model = await tf.loadGraphModel(`${window.location.origin}${window.location.pathname}/tfjs_saved_model/model.json`);
    maxLen = model.inputs[0].shape[1];
    console.log("Input Model: ", model.inputs);
    console.log("Outputs Model: ", model.outputs);
    isModelLoaded = true;

    // Memanggil word_index
    const word_indexjson = await fetch(`${window.location.origin}${window.location.pathname}/tfjs_saved_model/word_index.json`);
    word_index = await word_indexjson.json();

    console.log('Model & Metadata Loaded Successfully');
    document.getElementById('modelStatus').innerText = 'Model status: Ready';

    const response = await fetch(`${window.location.origin}${window.location.pathname}/content.json`);
    const data = await response.json();

    let labels = new Set();
    data.intents.forEach((intent) => {
        responses[intent.tag] = intent.responses;
        labels.add(intent.tag);
    });
    classLabels = [...labels];
    console.log("classLabels Loaded: ", classLabels);
    console.log("Responses Loaded: ", responses);
}

// Preprocess text
function preprocessText(text) {
    // Remove punctuation and convert to lowercase
    return text.toLowerCase().replace(/[^\w\s]/gi, '');
}

// Convert text to sequences
function textsToSequences(texts) {
    return texts.map(text => {
        const words = text.split(' ');
        return words.map(word => {
            // Get the word index, or use 0 for unknown words
            return word_index[word] || 0;
        });
    });
}

// Pad sequences to ensure consistent input shape
function padSequences(sequences, maxlen, padding = 'post', truncating = 'post') {
    return sequences.map(seq => {
        if (seq.length > maxlen) {
            // Truncate
            return truncating === 'pre'
                ? seq.slice(seq.length - maxlen)
                : seq.slice(0, maxlen);
        }

        // Pad with zeros
        const padded = new Array(maxlen).fill(0);
        const offset = padding === 'pre' ? maxlen - seq.length : 0;

        for (let i = 0; i < seq.length; i++) {
            padded[offset + i] = seq[i];
        }

        return padded;
    });
}

// Make prediction (trigger by button click)
async function predict() {
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    if (!isModelLoaded) {
        alert('Model is still loading. Please wait a moment and try again.');
        return;
    }
    console.log('\n\n------------------ PREDICT -------------------');

    loadingDiv.style.display = 'block';
    resultDiv.style.display = 'none';

    const userInput = document.getElementById('userInput').value;

    if (!userInput) {
        alert('Please enter some text');
        loadingDiv.style.display = 'none';
        return;
    }

    // anda siapa [[0 3 2]] whoami: 0.94
    // const userInput = "anda siapa";
    console.log(`Input User: "${userInput}"`);

    // Preprocess text
    const processedText = preprocessText(userInput);
    const textSequences = textsToSequences([processedText]);
    const paddedSequences = padSequences(textSequences, maxLen, "pre");

    console.log("Padded Sequences: ", paddedSequences);

    // Convert to tensor
    const inputTensor = tf.tensor2d(paddedSequences, [1, maxLen]);


    // Make prediction
    const prediction = model.predict({ Identity: inputTensor });

    // process prediction
    const probabilities = prediction.softmax();
    const predictionData = await probabilities.data();
    const predArray = Array.from(predictionData);

    console.log("\n=== DEBUG INFO ===");
    console.log("Jumlah output yang diprediksi:", predArray.length, "(Expected classes: 10)");

    // print array prediksi untuk setiap target kelas
    console.log("Array prediksi probabilitas untuk setiap kelas:", predArray);

    // result in HTML
    let html = `<h3>Prediction Result:</h3>
    <p>Input: "${userInput}"</p><p>Class probabilities:</p><ul>`;

    // print prediksi per kelas
    console.log("\nPrediksi per kelas:");
    predArray.forEach((prob, index) => {
        const className = classLabels[index] || `Class_${index}`;
        html += `<li>[${index}] ${className}: ${(prob * 100).toFixed(2)}%</li>`;
        console.log(`[${index}] ${className}: ${prob.toFixed(4)}`);
    });
    html += `</ul>`;

    // // (opsional) ambil nilai tertinggi:
    const maxPrediction = prediction.argMax(-1);
    maxPrediction.print(); // akan menampilkan index kelas prediksi (0-9)

    // Ambil nilai tertinggi dan probabilitasnya
    const predictionIndex = probabilities.argMax(-1).dataSync()[0]; // Indeks kelas tertinggi
    const predictionValue = probabilities.max().dataSync()[0]; // Probabilitas tertinggi

    html += `<p><strong>Predicted class: [${predictionIndex}] ${classLabels[predictionIndex]}</strong></p>`;

    console.log(`Prediksi kelas: [${predictionIndex}] ${classLabels[predictionIndex]}`);
    console.log(`Kemiripan (%) : ${(predictionValue * 100).toFixed(2)}%`);

    // Ambil indeks prediksi dari model
    const predictedTag = classLabels[predictionIndex]; // nama tag sesuai indeks

    // Ambil daftar respons untuk tag tersebut
    const possibleResponses = responses[predictedTag] || [];

    // Pilih salah satu response secara acak
    const randomResponse =
        possibleResponses[
        Math.floor(Math.random() * possibleResponses.length)
        ];

    html += `<p><strong>Response</strong>: ${randomResponse}</p>`
    console.log(`Respon: ${randomResponse}`);

    // Add raw data for debugging
    html += `<p>Raw prediction data:</p><pre>${JSON.stringify(predArray, null, 2)}</pre>`;

    // Format and display the result
    const formattedResult = html;
    resultDiv.innerHTML = formattedResult;
    resultDiv.style.display = 'block';

    // Clean up tensors
    // inputTensor.dispose();
}

// Load the model when the page loads
document.addEventListener('DOMContentLoaded', init);