// Global variables
let model;
let tokenizer;
let vocabSize;
let isModelLoaded = false;
let maxlen = 3;
const padding = 'post';
const truncating = 'post';

// Load the model
async function init() {
    // Memanggil model tfjs
    model = await tf.loadGraphModel('http://127.0.0.1:5500/tfjs_model_v4/model.json');
    isModelLoaded = true;

    //Memanggil word_index
    const word_indexjson = await fetch('http://127.0.0.1:5500/tfjs_model_v4/metadata.json');
    metadata = await word_indexjson.json();
    vocabSize = metadata.vocabulary_size;
    tokenizer = {
        word_index: metadata.word_index
    };

    console.log('Model & Metadata Loaded Successfully');
    document.getElementById('modelStatus').innerText = 'Model status: Ready';
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
            return tokenizer.word_index[word] || 0;
        });
    });
}

// Pad sequences to ensure consistent input shape
function padSequences(sequences, maxlen = 3, padding = 'post', truncating = 'post') {
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

// Make prediction
async function predict() {
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    if (!isModelLoaded) {
        alert('Model is still loading. Please wait a moment and try again.');
        return;
    }

    try {
        loadingDiv.style.display = 'block';
        resultDiv.style.display = 'none';

        const userInput = document.getElementById('userInput').value;

        if (!userInput) {
            alert('Please enter some text');
            loadingDiv.style.display = 'none';
            return;
        }

        // Preprocess text
        const processedText = preprocessText(userInput);
        const textSequences = textsToSequences([processedText]);

        // Pad sequences to match model's expected input shape (?, 3)
        const paddedSequences = padSequences(textSequences, 3, "pre");
        console.log("Padded sequences:", paddedSequences[0]);

        // Convert to tensor
        console.log(paddedSequences);
        const inputTensor = tf.tensor2d(paddedSequences);
        console.log("Input tensor shape:", inputTensor.shape);

        // Try multiple approaches for LSTM model inference
        let prediction;
        try {
            // Approach 1: Try direct execute
            console.log("Trying model.execute with direct tensor input");
            // prediction = model.executeAsync(inputTensor);
            // console.log(inputTensor);
            prediction = model.execute({ Identity: inputTensor });;
            console.log("Success with direct execute");
            // prediction = await prediction;
            console.log("Prediction:", prediction.print());
        } catch (error1) {
            console.log("Error with direct execute:", error1);

            try {
                // Approach 2: Try with a specific input name for LSTM models
                console.log("Trying with specific input names for LSTM model");
                // Common input names for LSTM models
                const possibleInputNames = [
                    "input_1",
                    "serving_default_input_1:0",
                    "serving_default_input_1",
                    "inputs:0",
                    "inputs"
                ];

                // Try each possible input name
                for (const inputName of possibleInputNames) {
                    try {
                        console.log(`Trying with input name: ${inputName}`);
                        const feedDict = {};
                        feedDict[inputName] = inputTensor;
                        prediction = model.execute(feedDict);
                        console.log(`Success with input name: ${inputName}`);
                        break; // Exit the loop if successful
                    } catch (nameError) {
                        console.log(`Failed with input name ${inputName}:`, nameError);
                        // Continue to next name
                    }
                }

                // If still no prediction, try executeAsync
                if (!prediction) {
                    console.log("Trying executeAsync as fallback");
                    prediction = await model.executeAsync(inputTensor);
                }
            } catch (error2) {
                console.log("All execute attempts failed, trying one last approach");

                // Approach 3: Try with the first input from model.inputs if available
                if (model.inputs && model.inputs.length > 0) {
                    const firstInputName = model.inputs[0].name;
                    console.log(`Last attempt with model's first input name: ${firstInputName}`);
                    const feedDict = {};
                    feedDict[firstInputName] = inputTensor;
                    prediction = model.execute(feedDict);
                } else {
                    // If all else fails, rethrow the original error
                    throw error1;
                }
            }
        }

        // Process prediction result
        let predictionData;
        if (Array.isArray(prediction)) {
            console.log("Prediction is an array with length:", prediction.length);
            predictionData = await prediction[0].data();
            // Clean up tensors
            prediction.forEach(tensor => tensor.dispose());
        } else {
            console.log("Prediction is a single tensor with shape:", prediction.shape);
            predictionData = await prediction.data;
            console.log(predictionData)
            // prediction.dispose();
        }

        // Format and display the result
        const formattedResult = formatPredictionResult(predictionData);
        resultDiv.innerHTML = formattedResult;
        resultDiv.style.display = 'block';

        // Clean up tensors
        inputTensor.dispose();

    } catch (error) {
        console.error("Error during prediction:", error);
        resultDiv.innerHTML = `
                    <p>Error: ${error.message}</p>
                    <p>This could be due to model incompatibility with the browser. Try these suggestions:</p>
                    <ul>
                        <li>Check the console for detailed error messages</li>
                        <li>Ensure the model was converted with correct options for LSTM support</li>
                        <li>Try reconverting the model with --control_flow_v2=true option</li>
                    </ul>`;
        resultDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Format prediction result for display
function formatPredictionResult(predictionData) {
    // Convert prediction data to array
    const predArray = Array.from(predictionData);

    // This formatting depends on your specific model output
    // Adjust based on whether it's classification, regression, etc.
    let html = `<h3>Prediction Result:</h3>`;

    // For classification models, show probabilities
    if (predArray.length > 1) {
        // If there are multiple classes
        html += `<p>Class probabilities:</p><ul>`;
        predArray.forEach((prob, index) => {
            html += `<li>Class ${index}: ${(prob * 100).toFixed(2)}%</li>`;
        });
        html += `</ul>`;

        // Show predicted class
        const predictedClass = predArray.indexOf(Math.max(...predArray));
        html += `<p><strong>Predicted class: ${predictedClass}</strong></p>`;
    } else {
        // For regression or single value output
        html += `<p>Prediction value: ${predArray[0].toFixed(4)}</p>`;
    }

    // Add raw data for debugging
    html += `<p>Raw prediction data:</p>
                    <pre>${JSON.stringify(predArray, null, 2)}</pre>`;

    return html;
}

// Load the model when the page loads
document.addEventListener('DOMContentLoaded', init);




    // try {
    //     // Load the model from your local server
    //     model = await tf.loadGraphModel('http://127.0.0.1:5500/tfjs_model_v4/model.json');

    //     console.log("Model Loaded");
    //     console.log("model.signature: ", model.signature);
    //     console.log("Model inputs:", model.inputs);
    //     console.log("Model outputs:", model.outputs);
    //     console.log("model.inputNodes: ", model.inputNodes);

    //     // Inspect model graph to understand input/output structure
    //     console.log("Model graph architecture:");
    //     for (const key in model.artifacts.modelTopology.node) {
    //         const node = model.artifacts.modelTopology.node[key];
    //         if (node.name) {
    //             console.log(`Node name: ${node.name}, Op: ${node.op}`);
    //             if (node.input && node.input.length > 0) {
    //                 console.log(`  Inputs: ${node.input.join(', ')}`);
    //             }
    //         }
    //     }

    //     // Now load the metadata
    //     await loadMetadata();

    //     // Update status
    //     document.getElementById('modelStatus').innerText = 'Model status: Ready';
    //     modelLoaded = true;
    // } catch (error) {
    //     console.error("Error loading model:", error);
    //     document.getElementById('modelStatus').innerText =
    //         'Model status: Error loading model. See console for details.';
    // }

// Load metadata separately
// async function loadMetadata() {
//     try {
//         const response = await fetch('http://127.0.0.1:5500/tfjs_model_v4/metadata.json');
//         const metadata = await response.json();
//         vocabSize = metadata.vocabulary_size;
//         tokenizer = {
//             word_index: metadata.word_index
//         };
//         console.log("Metadata loaded successfully");
//     } catch (error) {
//         console.error("Error loading metadata:", error);
//     }
// }