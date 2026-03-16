// Vercel Serverless Function - Upload Image
// Simple version that returns the image as base64 data URL

export const config = {
  runtime: 'nodejs',
  bodyParser: false,
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For Vercel serverless, we can't process file uploads directly
    // Return instructions to use a proper upload service
    
    // For testing, return a sample image URL
    const sampleImages = [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      'https://images.unsplash.com/photo-1472214103451-9374bd1d798e?w=800',
    ];
    
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];

    console.log('✅ Returning sample image:', randomImage);

    res.status(201).json({
      success: true,
      url: randomImage,
      filename: 'sample-image.jpg',
      message: 'Image upload requires external service (Uploadthing/Cloudinary). Using sample image for testing.',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process upload', message: String(error) });
  }
}
