# How To Use
- Jalankan index.html pakai live server
- Kode log ada di developer mode

## EROR
- tfjsmodel_V3
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