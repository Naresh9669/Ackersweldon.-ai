const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = 'mongodb://127.0.0.1:27017/dashboard_db';
  
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected successfully!');
    
    const db = client.db('dashboard_db');
    const collection = db.collection('news');
    
    const count = await collection.countDocuments();
    console.log('Total documents:', count);
    
    const sources = await collection.distinct('source');
    console.log('Available sources:', sources);
    
    const testNews = await collection.find({ source: 'test' }).toArray();
    console.log('Test news count:', testNews.length);
    if (testNews.length > 0) {
      console.log('Sample test news:', testNews[0]);
    }
    
    await client.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection(); 