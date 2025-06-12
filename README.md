
# Model1-TFJS
<img style="" src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />

What about this repo?
- Pengembangan Tensorflow model Text Classification yang di convert ke tfjs
- Penyimpanan Model hasil Push ETL dan tempat akses lewat Github Page (root adalah folder `tfjs_saved_model/`)

## ETL Process
- Dikelola di repo [histotalk-model1-etl](https://github.com/DBS-Coding/histotalk-model1-etl)
- 

## How to use
- Jalankan index.html pakai live server
- Lihat kode log di developer mode browser

## Using predict.js
- pakai file `predict.js` dan folder `tfjs_saved_model`
- contoh pemakaian di `predict.html`
```html
<script src="predict.js"></script>
    <script>
      (async () => {
        const result = await predictIntent("anda siapa");
        console.log(result);
      })();
    </script>
```
- contoh output:
```json
{
  "probabilities": [
    { "label": "greeting", "confidence": 0.0032 },
    { "label": "whoami", "confidence": 0.9365 },
    ...
  ],
  "predictedClass": "whoami",
  "confidence": 0.9365,
  "response": "Aku Soekarno, Proklamator Indonesia!"
}
```

## Old Issue
Anomalis Perbedaan Model latihan-tfjs dan model1:
- latihan bisa model.predict(input) tanpa perlu inisiasi tambahan, sedangkan model1 perlu model.predict({ Identity: inputTensor });
- latihan dan model1 sama-sama tidak punya DType dan Shape OutputLayer
- model1 hanya punya 3 neuron probalitas output (mungkin ini mengikuti input)
```bash
    - tfjs version 2.18.0
    - tfjs version: v4.22.0
model.executeAsync()
script.js:83 Error during prediction: Error: This execution contains the node 'StatefulPartitionedCall/functional_1/lstm_1/while/exit/_41', which has the dynamic op 'Exit'. Please use model.executeAsync() instead. Alternatively, to avoid the dynamic ops, specify the inputs [Identity]
    at HTMLButtonElement.<anonymous> (script.js:72:44)

model.execute()
script.js:84 Error during prediction: Error: Cannot compute the outputs [Identity] from the provided inputs [inputs:0]. Consider providing the following inputs: []. Alternatively, to avoid the dynamic ops, use model.execute() and specify the inputs [Identity]
    at h (tf.min.js:17:2100)
    at Generator.<anonymous> (tf.min.js:17:3441)
    at Generator.next (tf.min.js:17:2463)
    at u (tf.min.js:17:8324)
    at o (tf.min.js:17:8527)
```