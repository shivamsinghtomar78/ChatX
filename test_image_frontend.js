// Test script to verify image display in frontend
const testImageDisplay = () => {
    // Simulate the exact response format from the backend
    const aiResponse = "I've generated an image for 'sitting in the snow with polar bear'.\n\n[IMAGE_GENERATED:generated_3532.png]";
    
    // Test the parsing logic
    if (aiResponse.includes('[IMAGE_GENERATED:')) {
        const parts = aiResponse.split('[IMAGE_GENERATED:');
        const beforeImage = parts[0];
        const afterParts = parts[1].split(']');
        const filename = afterParts[0];
        const afterImage = afterParts[1] || '';
        const imageUrl = `/api/image/${filename}`;
        
        console.log('Parsing results:');
        console.log('Before image:', beforeImage);
        console.log('Filename:', filename);
        console.log('After image:', afterImage);
        console.log('Image URL:', imageUrl);
        
        // Verify the image URL is correct
        const expectedUrl = '/api/image/generated_3532.png';
        if (imageUrl === expectedUrl) {
            console.log('✓ Image URL is correct');
        } else {
            console.log('✗ Image URL is incorrect');
            console.log('Expected:', expectedUrl);
            console.log('Actual:', imageUrl);
        }
        
        // Test that the image file exists
        fetch(imageUrl)
            .then(response => {
                if (response.ok) {
                    console.log('✓ Image can be fetched from API');
                    console.log('Content-Type:', response.headers.get('Content-Type'));
                } else {
                    console.log('✗ Failed to fetch image from API');
                    console.log('Status:', response.status);
                }
            })
            .catch(error => {
                console.log('✗ Error fetching image:', error);
            });
    } else {
        console.log('Response does not contain image marker');
    }
};

// Run the test
testImageDisplay();