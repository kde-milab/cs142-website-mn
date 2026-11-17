import mongoose from 'mongoose';

/**
 * Өгөгдлийн сангийн схемийн мэдээллийн (SchemaInfo) Mongoose схем.
 */
const schemaInfoSchema = new mongoose.Schema({
  version: String,
  load_date_time: { type: Date, default: Date.now },
});

/**
 * schemaInfoSchema-г ашиглан SchemaInfo Mongoose модель үүсгэнэ.
 */
const SchemaInfo = mongoose.model('SchemaInfo', schemaInfoSchema);

export default SchemaInfo;
