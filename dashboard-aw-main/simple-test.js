const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = 'mongodb://127.0.0.1:27017/dashboard_db';
  
  try {
    console.log('Testing MongoDB connection with authMechanism...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected successfully with authMechanism!');
    
    const db = client.db('dashboard_db');
    const collection = db.collection('news');
    
    const count = await collection.countDocuments();
    console.log('Total documents:', count);
    
    await client.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error with authMechanism:', error.message);
  }
}

testConnection(); 