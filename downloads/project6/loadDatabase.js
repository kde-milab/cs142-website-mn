/**
 * Энэ Node.js программ ICSI301 Төсөл 6-ын модель өгөгдлийг Mongoose-оор
 * тодорхойлсон объект болгон MongoDB өгөгдлийн санд ачаална. Ажиллуулахдаа:
 *     node loadDatabase.js
 * Ажиллуулахаас өмнө localhost дээр MongoDB ажиллаж байгаа эсэхийг шалгаарай.
 *
 * Өгөгдлийг 'icsi301project6' нэртэй MongoDB өгөгдлийн сангийн User, Photo,
 * SchemaInfo цуглуулгуудад ачаална. Сэтгэгдлүүд (Comment) харьяалагдах
 * зурагныхаа дотор хадгалагдана. Эдгээр цуглуулгад өмнө нь байсан бүх
 * объектыг устгана. Тиймээс олон удаа ажиллуулахад аюулгүй.
 *
 * Өгөгдлийн сантай хийх асинхрон дуудлагуудыг async/await болон
 * Promise.all()-оор зохион байгуулсан.
 */

// Өгөгдлийн санд хадгалах схемийг Mongoose-оор тодорхойлно.
import mongoose from 'mongoose';

// Өмнөх төслүүдэд ашигласан "шидэт" модель өгөгдөл.
import icsi301models from './src/modelData/photoApp.js';

// User, Photo, SchemaInfo-гийн Mongoose схемийг ачаална.
import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';

const mongoUrl = 'mongodb://127.0.0.1/icsi301project6';
const versionString = '1.0';

async function loadDatabase() {
  // Эхлээд цуглуулгуудад байгаа бүх зүйлийг устгана.
  await Promise.all([
    User.deleteMany({}),
    Photo.deleteMany({}),
    SchemaInfo.deleteMany({}),
  ]);

  // Хэрэглэгчдийг User цуглуулгад ачаална. MongoDB объект бүрт өөрөө _id
  // оноодог. Хуурамч модель өгөгдлийн _id-г MongoDB-гийн жинхэнэ _id-тай
  // холбосон хүснэгтийг (Map) хадгалж, дараа нь зураг, сэтгэгдэлд ашиглана.
  const userModels = icsi301models.userListModel();
  const fakeId2RealId = new Map();
  await Promise.all(
    userModels.map(async (user) => {
      const userObj = await User.create({
        first_name: user.first_name,
        last_name: user.last_name,
        location: user.location,
        description: user.description,
        occupation: user.occupation,
      });
      fakeId2RealId.set(user._id, userObj._id);
      console.log('Хэрэглэгч нэмлээ:', user.first_name + ' ' + user.last_name, 'ID:', userObj._id);
    })
  );

  // Бүх хэрэглэгчийг ачаалсны дараа зургуудыг нэмнэ. Зургийн user_id болон
  // сэтгэгдлийн user_id нь User объектын MongoDB-гийн оноосон _id байна.
  const photoModels = userModels.flatMap((user) => icsi301models.photoOfUserModel(user._id));
  await Promise.all(
    photoModels.map(async (photo) => {
      const comments = (photo.comments ?? []).map((comment) => {
        console.log(
          'Урт нь %d сэтгэгдлийг %s хэрэглэгчээс %s зурагт нэмлээ',
          comment.comment.length,
          fakeId2RealId.get(comment.user._id),
          photo.file_name
        );
        return {
          comment: comment.comment,
          date_time: comment.date_time,
          user_id: fakeId2RealId.get(comment.user._id),
        };
      });
      const photoObj = await Photo.create({
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: fakeId2RealId.get(photo.user_id),
        comments,
      });
      console.log('Зураг нэмлээ:', photo.file_name, 'хэрэглэгчийн ID:', photoObj.user_id);
    })
  );

  // SchemaInfo объект үүсгэнэ.
  const schemaInfo = await SchemaInfo.create({ version: versionString });
  console.log('SchemaInfo объект үүслээ, хувилбар:', schemaInfo.version);
}

try {
  await mongoose.connect(mongoUrl);
  await loadDatabase();
} catch (err) {
  console.error('Өгөгдлийн санг ачаалахад алдаа гарлаа:', err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
