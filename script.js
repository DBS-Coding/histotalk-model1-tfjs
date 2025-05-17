let model;
let labels = [];
let responses = {};

async function loadModel() {
    model = await tf.loadGraphModel('http://127.0.0.1:5500/tfjs_model_v3/model.json');
    console.log("Model Loaded");
    console.log("model.signature: ",model.signature);
    console.log("Model inputs:", model.inputs);
    console.log("Model outputs:", model.outputs);
    console.log("model.inputNodes: ",model.inputNodes); // Check for valid input node names
    // alert("Model Loaded");
}

async function loadContent() {
    const response = await fetch('http://127.0.0.1:5500/content.json');
    const data = await response.json();

    data.intents.forEach(intent => {
        labels.push(intent.tag);
        responses[intent.tag] = intent.responses;
    });

    console.log("Labels: ", labels);
    console.log("responses: ", responses);
}

function preprocess(text) {
    text = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    let sequence = Array.from(text).map(ch => ch.charCodeAt(0) % 100);

    const inputShape = 3; // Model expects input with 3 features
    while (sequence.length < inputShape) sequence.push(0); // Padding if necessary
    return tf.tensor([sequence.slice(0, inputShape)], [1, 3], "float32"); // Shape: [1, 3]
}

function getRandomResponse(tag) {
    const possibleResponses = responses[tag] || ["Maaf, saya tidak mengerti."];
    return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadModel();
    await loadContent();

    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    const chatbox = document.getElementById('chatbox');

    sendButton.addEventListener('click', async () => {
        const text = userInput.value.trim();
        if (!text) return;
    
        chatbox.innerHTML += `<div><b>Kamu:</b> ${text}</div>`;
        userInput.value = "";
    
        // Example Input Data (Shape: [1, 3], Type: float32)
        // const inputs = tf.tensor([[1, 45, 76]], [1, 3], 'float32');
        // const inputName = model.inputNames[0];
        // console.log("input name: ", inputName);
        // console.log(model.inputNames); // Outputs an array of input names
        // const inputTensor = preprocess(text);
        // console.log("inputTensor :", inputTensor);
        // const inputs = { "inputs": inputTensor }; // Ensure input tensor matches the required shape
        // const prediction = model.execute(inputs); // Use model.execute()
        // console.log("inputs :", inputs);
        //         {
        //     "inputs": {
        //         "kept": false,
        //         "isDisposedInternal": false,
        //         "shape": [
        //             1,
        //             3
        //         ],
        //         "dtype": "float32",
        //         "size": 3,
        //         "strides": [
        //             3
        //         ],
        //         "dataId": {
        //             "id": 34
        //         },
        //         "id": 34,
        //         "rankType": "2"
        //     }
        // }

        const inputTensor = preprocess(text); // shape: [1,3]
        try {
            const prediction = await model.execute({ 'inputs:0': inputTensor });
            const predictionData = await prediction.data();
            console.log("Prediction output:", predictionData);
            // const prediction = await model.executeAsync(inputs); // Run model
            // const prediction = await model.executeAsync({ 'inputs' : inputs });
            // console.log(prediction);
            // Execute the model using the correct input name from SignatureDef
            // const prediction = await model.execute({ inputs: inputs }); // mungkin model.predict ?? losksi eror
            // const prediction = await model.predict(inputs); // mungkin model.predict ?? losksi eror
            // const prediction = await model.predict([[0, 0, 0]]); // mungkin model.predict ?? losksi eror
            // console.log(prediction);
            // const predictionArray = await prediction.data(); // Extract array data
            // const outputIndex = predictionArray.indexOf(Math.max(...predictionArray)); // Find highest probability
    
            // const predictedTag = labels[outputIndex]; // Map to tag
            // const botReply = getRandomResponse(predictedTag); // Get response
    
            // chatbox.innerHTML += `<div><b>Soekarno:</b> ${botReply}</div>`;
            // chatbox.scrollTop = chatbox.scrollHeight;
        } catch (error) {
            console.error("Error during prediction:", error);
            // chatbox.innerHTML += `<div><b>Soekarno:</b> Maaf, saya tidak mengerti.</div>`;
        }
    });
});
