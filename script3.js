

// Load model
async function loadModel() {
    const model = await tf.loadGraphModel('http://127.0.0.1:5500/tfjs_model_v3/model.json');
    return model;
}

async function loadTokenizer() {
    const response = await fetch('http://127.0.0.1:5500/tokenizer.json'); // Pastikan file ini tersedia
    const tokenizerData = await response.json();
    return tokenizerData;
}

// Fungsi untuk membersihkan dan memproses input
function preprocessInput(inputText) {
    inputText = inputText.toLowerCase().replace(/[^\w\s]/gi, ''); // Hapus tanda baca
    return inputText;
}

// Menjalankan prediksi dari model
async function predictResponse(inputText) {
    const tokenizer = await loadTokenizer(); // Pastikan ini ada sebelum digunakan
    const model = await loadModel();
    
    let cleanedInput = preprocessInput(inputText);
    
    // Tokenisasi dan padding (sesuaikan dengan model)
    let tokenizedInput = tokenizer.texts_to_sequences([cleanedInput]); // Gunakan tokenizer dari Python
    let paddedInput = tf.tensor2d(tokenizedInput, [1, input_shape]); // Pastikan sesuai input_shape model

    // Prediksi output
    let output = model.predict(paddedInput);
    let predictedIndex = output.argMax(1).dataSync()[0];

    // Mengambil tag respons
    let responseTag = le.inverse_transform([predictedIndex])[0]; // Gunakan label encoder dari Python
    let response = responses[responseTag][Math.floor(Math.random() * responses[responseTag].length)];

    console.log("Soekarno: ", response);
}

// Contoh penggunaan
predictResponse("Apa kabar?");