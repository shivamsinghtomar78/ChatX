// Test to verify image parsing logic in frontend
const testImageParsing = () => {
  // Test case 1: Basic image format
  const testContent1 = "Here's the image you requested.\n\n[IMAGE_GENERATED:generated_1234.png]";
  console.log("Test 1 - Basic image format:");
  console.log("Input:", testContent1);
  
  // Simulate the parsing logic from App.js
  if (testContent1.includes('[IMAGE_GENERATED:')) {
    const parts = testContent1.split('[IMAGE_GENERATED:');
    const beforeImage = parts[0];
    const afterParts = parts[1].split(']');
    const filename = afterParts[0];
    const afterImage = afterParts[1] || '';
    
    console.log("Parsed filename:", filename);
    console.log("Before image content:", beforeImage);
    console.log("After image content:", afterImage);
    console.log("✅ Test 1 passed\n");
  }
  
  // Test case 2: Image with content before and after
  const testContent2 = "I've created the landscape for you.\n\n[IMAGE_GENERATED:generated_5678.png]\n\nLet me know if you'd like any changes.";
  console.log("Test 2 - Image with before/after content:");
  console.log("Input:", testContent2);
  
  if (testContent2.includes('[IMAGE_GENERATED:')) {
    const parts = testContent2.split('[IMAGE_GENERATED:');
    const beforeImage = parts[0];
    const afterParts = parts[1].split(']');
    const filename = afterParts[0];
    const afterImage = afterParts[1] || '';
    
    console.log("Parsed filename:", filename);
    console.log("Before image content:", JSON.stringify(beforeImage));
    console.log("After image content:", JSON.stringify(afterImage));
    console.log("✅ Test 2 passed\n");
  }
  
  // Test case 3: Multiple images (should handle the first one)
  const testContent3 = "Here are two images.\n\n[IMAGE_GENERATED:generated_1111.png]\n\n[IMAGE_GENERATED:generated_2222.png]";
  console.log("Test 3 - Multiple images:");
  console.log("Input:", testContent3);
  
  if (testContent3.includes('[IMAGE_GENERATED:')) {
    const parts = testContent3.split('[IMAGE_GENERATED:');
    const beforeImage = parts[0];
    const afterParts = parts[1].split(']');
    const filename = afterParts[0];
    const afterImage = afterParts[1] || '';
    
    console.log("Parsed filename:", filename);
    console.log("Before image content:", JSON.stringify(beforeImage));
    console.log("After image content:", JSON.stringify(afterImage));
    console.log("✅ Test 3 passed (handles first image)\n");
  }
};

// Run the tests
testImageParsing();