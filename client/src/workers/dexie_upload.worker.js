onmessage = async function(e) {
    const { file } = e.data;
    const reader = new FileReader();

    reader.onload = function() {
        const lines = reader.result.split('\n');
        for (const line of lines) {
            try {
                if (line) { // Avoid empty lines
                    const customer = JSON.parse(line);
                    // Post each customer object back to the main thread
                    postMessage({ customer });
                }
            } catch (error) {
                console.error('Error parsing JSON line in worker:', error);
                // Optionally, send error back to main thread
                postMessage({ error: error.toString() });
            }
        }
    };

    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        postMessage({ error: error.toString() });
    };

    reader.readAsText(file);
};
