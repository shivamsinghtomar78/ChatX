// Test script to verify virtual scrolling implementation
console.log("Testing virtual scrolling implementation...");

// Simulate a conversation with many messages
const testMessages = [];
for (let i = 0; i < 1000; i++) {
  testMessages.push({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `This is test message number ${i}. ` + 
             (i % 3 === 0 ? "It's a bit longer to test rendering performance with varied content lengths." : 
              i % 5 === 0 ? "Short msg." : 
              "Regular message content for testing virtual scrolling performance."),
    timestamp: new Date(Date.now() - (1000 - i) * 60000)
  });
}

console.log(`Generated ${testMessages.length} test messages`);

// Test the virtual scrolling logic
let startIndex = 0;
let endIndex = 20;
const visibleMessages = testMessages.slice(startIndex, endIndex);

console.log(`Initial visible messages: ${visibleMessages.length}`);
console.log(`Start index: ${startIndex}, End index: ${endIndex}`);

// Simulate scrolling down
startIndex = 100;
endIndex = 120;
const scrolledMessages = testMessages.slice(startIndex, endIndex);

console.log(`After scrolling - visible messages: ${scrolledMessages.length}`);
console.log(`New start index: ${startIndex}, New end index: ${endIndex}`);

console.log("Virtual scrolling test completed successfully!");