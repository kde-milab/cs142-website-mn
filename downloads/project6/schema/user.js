import mongoose from 'mongoose';

/**
 * Хэрэглэгчийн (User) Mongoose схем.
 */
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  location: String,
  description: String,
  occupation: String,
});

/**
 * userSchema-г ашиглан User Mongoose модель үүсгэнэ.
 */
const User = mongoose.model('User', userSchema);

export default User;
