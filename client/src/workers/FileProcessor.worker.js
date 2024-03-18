// FileProcessorWorker.ts
const DEFAULT_CHUNK_SIZE = 100; // Adjust based on your needs

// interface LoadFileMessage {
//   action: "load_file";
//   file_name: string;
//   file: File;
// }

// interface DataChunkMessage {
//   action: "insert_data_in_bulk";
//   file_name: string;
//   data: any[];
//   partial: boolean;
// }

async function processStream(file, fileName, chunkSizeValue) {
  const reader = file.stream().getReader();
  const chunkSize = chunkSizeValue || DEFAULT_CHUNK_SIZE;
  let decoder = new TextDecoder("utf-8");
  let chunkAccumulator = [];
  let incompleteLine = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      // console.log("[FileProcessor] Read chunk from file:", value, "Done:", done);
      if (done) break;

      // Decode binary data to text, including any incomplete line from the previous chunk
      let chunkText = incompleteLine + decoder.decode(value, { stream: true });
      let lines = chunkText.split(/\r\n|\n/);
      incompleteLine = lines.pop() || ''; // Save the last, potentially incomplete, line

      // Process each complete line
      lines.forEach((line) => {
        if (line) { // Check to avoid empty lines, especially the first line if it starts with a newline
          try {
            const {origin, ...obj} = JSON.parse(line);
            chunkAccumulator.push(obj);

            if (chunkAccumulator.length >= chunkSize) {
              // console.log("[FileProcessor] Sending chunk of data to Dexie:", chunkAccumulator);
              postMessage({
                from: "file_processor",
                action: "upsert_data_in_bulk",
                file_name: fileName,
                data: chunkAccumulator,
                partial: true
              });
              chunkAccumulator = [];
            }
          } catch (error) {
            console.error("Error parsing line to JSON:", error);
          }
        }
      });
    }

    // Handle any remaining partial line as a final complete line
    if (incompleteLine) {
      try {
        const {origin, ...obj} = JSON.parse(incompleteLine);
        chunkAccumulator.push(obj);
      } catch (error) {
        console.error("Error parsing final line to JSON:", error);
      }
    }

    // Send any remaining data as the final chunk
    if (chunkAccumulator.length > 0) {
      // console.log("[FileProcessor] Sending last chunk of data to Dexie:", chunkAccumulator);
      postMessage({
        from: "file_processor",
        action: "upsert_data_in_bulk",
        file_name: fileName,
        data: chunkAccumulator,
        partial: false
      });
    }
  } catch (error) {
    console.error("Error reading the file stream:", error);
  } finally {
    reader.releaseLock();
  }
}

onmessage = async function(event) {
  try {
    const message = event.data;

    if (message.action === "load_file") {
      console.log("[FileProcessor] Received file to process:", message.file_name);
      await processStream(message.file, message.file_name, message.chunkSize);
      console.log("[FileProcessor] Finished processing file:", message.file_name);
    }
  } catch (error) {
    console.error("[FileProcessor] Worker error:", error);
  }
}

export {};
