"use server"
import mongoose, { Connection } from "mongoose";

let cachedConnection: Connection | null = null;

export async function connectToMongoDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  
  try {
    // Disconnect if there's an existing connection that's not ready
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dashboard_db';
    console.log('MongoDB URI:', mongoUri);
    console.log('Environment variables:', Object.keys(process.env).filter(key => key.includes('MONGODB')));
    const cnx = await mongoose.connect(mongoUri);
    
    // Wait for the connection to be ready
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      
      // If already connected, resolve immediately
      if (mongoose.connection.readyState === 1) {
        resolve(true);
      }
    });
    
    cachedConnection = cnx.connection;
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}