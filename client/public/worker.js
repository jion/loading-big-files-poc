// worker.js
self.onmessage = function(e) {
    const { file } = e.data;
    console.log('Worker received file:', file.name);

    // Process the file here (e.g., read its content, parse, etc.)

    // After processing, you might want to post results back to your main script
    // self.postMessage({ result: 'Processing result or data' });
};
