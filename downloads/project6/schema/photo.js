import mongoose from 'mongoose';

/**
 * Сэтгэгдлийн (Comment) Mongoose схем.
 */
const commentSchema = new mongoose.Schema({
  // Сэтгэгдлийн текст.
  comment: String,
  // Сэтгэгдэл бичсэн огноо, цаг.
  date_time: { type: Date, default: Date.now },
  // Сэтгэгдэл бичсэн хэрэглэгчийн ID.
  user_id: mongoose.Schema.Types.ObjectId,
});

/**
 * Зургийн (Photo) Mongoose схем.
 */
const photoSchema = new mongoose.Schema({
  // Зургийн файлын нэр (public/images хавтаст байрлана).
  file_name: String,
  // Зургийг өгөгдлийн санд нэмсэн огноо, цаг.
  date_time: { type: Date, default: Date.now },
  // Зургийн эзэн хэрэглэгчийн ID.
  user_id: mongoose.Schema.Types.ObjectId,
  // Энэ зураг дээр бичсэн сэтгэгдлүүдийн массив.
  comments: [commentSchema],
});

/**
 * photoSchema-г ашиглан Photo Mongoose модель үүсгэнэ.
 */
const Photo = mongoose.model('Photo', photoSchema);

export default Photo;
