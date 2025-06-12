
<p align="center">
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
</p>

# Model1-TFJS

What about this repo?
- Pengembangan Tensorflow model Text Classification yang di convert ke tfjs
- Penyimpanan Model hasil Push ETL dan tempat akses lewat Github Page (root adalah folder `tfjs_saved_model/`)

Struktur file:
```
tfjs_saved_model/
├── hatta/
│   ├── model.json
│   ├── group1-shard1of1.bin
│   ├── word_index.json
│   └── content.json
├── soekarno/
│   ├── model.json
│   ├── group1-shard1of1.bin
│   ├── word_index.json
│   └── content.json
index.html
notebook.ipynb
```
- `tfjs_saved_model/` tempat menyimpan model
- `index.html` pengujian model
- `notebook.ipynb` pengembangan model text classifikasi. 
- `developer note.txt` Catatan karena notebook tidak bisa run di local, ada kendala version tensorflow dan tfjs. Tapi anehnya di GColab aman, padahal saya mengikuti versi di itu, mungkin karena Conda hanya bisa pakai versi Python 3.11.0 (Local) bukan 3.11.13 (G Colab)
```
Model stabil sekarang adalah FeedForward Neural Network (FFNN) menggunakan GlobalAveragePooling1D
```
## ETL Process
- Dikelola di repo [histotalk-model1-etl](https://github.com/DBS-Coding/histotalk-model1-etl)
- Model yang diproses sekarang adalah `tfjs_saved_model/soekarno/` & `tfjs_saved_model/hatta/` 

## How to use
- gunakan versi [Google Colab](https://colab.research.google.com/drive/1-TAnRcF9nQDfF3vKAwQbQxohNvbiOU6P?usp=sharing) [kemungkinan local tidak bisa run ☠️]
- Jalankan index.html pakai live server
- Lihat kode log di developer mode browser
- bandingkan hasil kedua versi (Pyhton & Js)

## Current Issue
Code sudah fix, prediksi TFJS yang punya class sama dengan yang di GColab sudah **pernah** tercapai. 
Namun, kode di proses ETL malah menghasilkan skema word index berbeda.
```
- **Input**: "halo pak"
- Padding Sequences
  - Versi TF: [[59, 30, 0, 0]]
  - Versi TFJS (ETL): [[0, 0, 27, 15]] 
```

## Old Issue
Asumsi: karena versi model LSTM bermasalah, sekarang saya pakai 

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