// // import mongoose from 'mongoose';

// // const connectDB = async () => {
// //   try {
// //     const conn = await mongoose.connect(process.env.MONGODB_URI);
// //     console.log(`MongoDB Connected: ${conn.connection.host}`);
// //   } catch (error) {
// //     console.error(`Error: ${error.message}`);
// //     process.exit(1);
// //   }
// // };

// // export default connectDB;







// // db.js
// import mongoose from 'mongoose';

// const connectDB = async () => {
//   try {
//     // Encode special characters in connection string
//     const uri = encodeURI(process.env.MONGODB_URI);
//     console.log('Encoded MongoDB URI:', process.env.MONGODB_URI);

   

//     const conn = await mongoose.connect(uri);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);

//     // Handle connection events
//     mongoose.connection.on('error', (err) => {
//       console.error('MongoDB connection error:', err);
//     });

//     mongoose.connection.on('disconnected', () => {
//       console.log('MongoDB disconnected');
//     });

//   } catch (error) {
//     console.error(`MongoDB connection failed: ${error.message}`);
//     process.exit(1);
//   }
// };

// export default connectDB;





// db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Updated options without deprecated flags
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin'
    };

    console.log('Attempting MongoDB connection...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    if (conn.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready');
    }

    console.log(`MongoDB Connected successfully to: ${conn.connection.host}`);

    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;

  } catch (error) {
    console.error('MongoDB connection failed:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

export default connectDB;