document.addEventListener('DOMContentLoaded', (event) => {
    const ws = new WebSocket('ws://localhost:8080');
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');

    ws.onopen = () => {
        console.log('Connected to the server');
    };

    ws.onmessage = (message) => {
        console.log('Message from server:', message.data);
    };

    ws.onerror = (error) => {
        console.log('WebSocket error:', error);
    };

    sendButton.onclick = () => {
        const message = messageInput.value;
        if (message) {
            ws.send(message);
            console.log('Message sent:', message);
            messageInput.value = ''; // Clear the input after sending
        }
    };
});
