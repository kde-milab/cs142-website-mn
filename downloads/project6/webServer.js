/**
 * ICSI301 Төсөл 6-ын веб сервер. Төсөл 5-ын веб сервер дээр суурилсан бөгөөд
 * 'icsi301project6' нэртэй MongoDB өгөгдлийн сантай холбогддог.
 *
 * Серверийг асаахдаа:
 *    npm start        (эсвэл node webServer.js)
 *    npm run dev      (серверийн код өөрчлөгдөх бүрт автоматаар дахин асна)
 *
 * Анхааруулга: localhost:3000-д холбогдож чадах хэн ч dist/ хавтас доторх
 * файлуудыг татаж авах боломжтой.
 *
 * Энэ веб сервер дараах URL-уудыг өгнө:
 * /test        - Өгөгдлийн сангийн SchemaInfo объектыг JSON хэлбэрээр буцаана.
 *                MongoDB-тэй холбогдож байгаа эсэхийг шалгахад тохиромжтой.
 * /test/info   - /test-тэй ижил.
 * /test/counts - Өгөгдлийн сан дахь цуглуулга (collection) бүрийн объектын
 *                тоог буцаана. Шинж нь цуглуулгын нэр, утга нь тоо байх JSON
 *                объект.
 *
 * Дараах URL-ууд хариугаа өгөгдлийн сангаас авдаг болгож өөрчлөгдөх ёстой:
 * /user/list         - Хажуугийн навигацийн жагсаалтад хэрэгтэй хэрэглэгчдийн
 *                      массив (JSON).
 * /user/:id          - _id нь id-тай хэрэглэгчийн дэлгэрэнгүй мэдээлэл (JSON).
 * /photosOfUser/:id  - id-тай хэрэглэгчийн бүх зураг. Зураг бүр өөр дээрээ
 *                      бичигдсэн бүх сэтгэгдлийг агуулна (JSON).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import mongoose from 'mongoose';

// User, Photo, SchemaInfo-гийн Mongoose схемийг ачаална.
import User from './schema/user.js';
import Photo from './schema/photo.js';
import SchemaInfo from './schema/schemaInfo.js';

// XXX - Таны илгээх код энэ мөргүйгээр ажиллах ёстой. Тест ажиллуулахаас
// болон илгээхээс өмнө энэ мөрийг устгаарай!
import icsi301models from './src/modelData/photoApp.js';

const portno = 3000; // Ашиглах портын дугаар
const mongoUrl = 'mongodb://127.0.0.1/icsi301project6';
const distDir = join(import.meta.dirname, 'dist');

// mongoose.connect() нь Promise буцаана. Холболт тогтохоос өмнө ирсэн
// хайлтуудыг Mongoose хүлээлгэж (buffer) байгаад холбогдсоны дараа ажиллуулна.
mongoose
  .connect(mongoUrl)
  .then(() => console.log('MongoDB-д холбогдлоо: ' + mongoUrl))
  .catch((err) => {
    console.error('MongoDB-д холбогдож чадсангүй. mongod ажиллаж байгаа эсэхийг шалгана уу.', err.message);
  });

const app = express();

/**
 * Express нь URL-ийн параметрийг задалж өгдөг. Доорх зам /test болон
 * /test/<ямар нэг зүйл> хоёуланд нь тохирох ба <ямар нэг зүйл>-ийг
 * request.params.p1-д өгнө. ({/:p1} нь Express 5-ын заавал биш параметр.)
 *
 * /test        - Өгөгдлийн сангийн SchemaInfo объектыг JSON хэлбэрээр буцаана.
 * /test/info   - /test-тэй ижил.
 * /test/counts - Цуглуулга бүрийн объектын тоог JSON хэлбэрээр буцаана.
 */
app.get('/test{/:p1}', async (request, response) => {
  // Express нь URL-ийн ":p1" хэсгийг ялгаж request.params объектод өгнө.
  console.log('/test дуудагдлаа, param1 = ', request.params.p1);

  const param = request.params.p1 || 'info';

  if (param === 'info') {
    try {
      // SchemaInfo ганцхан байх ёстой. {} хайлт түүнд тохирно.
      const info = await SchemaInfo.findOne({});
      if (!info) {
        // Хайлт алдаагүй ч SchemaInfo объект олдсонгүй. Энэ нь мөн серверийн
        // дотоод алдаа.
        response.status(500).send('SchemaInfo алга');
        return;
      }
      // Объект олдлоо. JSON хэлбэрээр буцаана.
      console.log('SchemaInfo', info);
      response.status(200).send(info);
    } catch (err) {
      // Хайлт алдаа буцаасан. Алдааг хөтөч рүү Internal Server Error (500)
      // кодтой буцаана.
      console.error('/test/info алдаа:', err);
      response.status(500).send(JSON.stringify(err));
    }
  } else if (param === 'counts') {
    // Бүх цуглуулгын тоог буцаахын тулд цуглуулга бүрт асинхрон
    // countDocuments() хайлт хийнэ. Эдгээр хайлт бие биеэсээ хамааралгүй тул
    // нэг нэгээр нь хүлээх (await) шаардлагагүй. Бүгдийг нэг дор эхлүүлээд
    // Promise.all()-оор бүгд дуусахыг хүлээнэ. Ингэснээр татан авалт зэрэгцээ
    // явагдана.
    //
    // Анхаар: дараах код хайлтуудыг ЦУВАА болгоно (эхнийх нь дуусахыг хүлээж
    // байж дараагийнх эхэлнэ):
    //     for (const col of collections) {
    //       col.count = await col.collection.countDocuments({});
    //     }
    const collections = [
      { name: 'user', collection: User },
      { name: 'photo', collection: Photo },
      { name: 'schemaInfo', collection: SchemaInfo },
    ];
    try {
      const counts = await Promise.all(
        collections.map((col) => col.collection.countDocuments({}))
      );
      const obj = {};
      collections.forEach((col, i) => {
        obj[col.name] = counts[i];
      });
      response.status(200).send(obj);
    } catch (err) {
      response.status(500).send(JSON.stringify(err));
    }
  } else {
    // Ойлгохгүй параметр ирвэл Bad Request (400) төлөв буцаана.
    response.status(400).send('Буруу параметр ' + param);
  }
});

/**
 * URL /user/list - Бүх хэрэглэгчийн объектыг буцаана.
 */
app.get('/user/list', (request, response) => {
  response.status(200).send(icsi301models.userListModel());
});

/**
 * URL /user/:id - id-тай хэрэглэгчийн мэдээллийг буцаана.
 */
app.get('/user/:id', (request, response) => {
  const id = request.params.id;
  const user = icsi301models.userModel(id);
  if (user === null) {
    console.log('_id:' + id + ' хэрэглэгч олдсонгүй.');
    response.status(400).send('Олдсонгүй');
    return;
  }
  response.status(200).send(user);
});

/**
 * URL /photosOfUser/:id - id-тай хэрэглэгчийн зургуудыг буцаана.
 */
app.get('/photosOfUser/:id', (request, response) => {
  const id = request.params.id;
  const photos = icsi301models.photoOfUserModel(id);
  if (photos.length === 0) {
    console.log('_id:' + id + ' хэрэглэгчийн зураг олдсонгүй.');
    response.status(400).send('Олдсонгүй');
    return;
  }
  response.status(200).send(photos);
});

// dist/ доторх файлуудыг (index.html, JS багц, зураг) express.static
// (https://expressjs.com/en/starter/static-files.html) модуль үйлчилнэ.
app.use(express.static(distDir));

// Гүн холбоос (deep linking): BrowserRouter нь /users/:userId гэх мэт URL
// ашигладаг. Хөтчийг сэргээх (refresh) үед ийм URL серверт ирэх тул дээрх
// замуудын алинд нь ч тохироогүй GET хүсэлтэд аппын index.html-ийг буцаана.
// Ингэснээр React Router URL-ийг уншиж зөв харагдацыг рендерлэнэ.
app.use((request, response, next) => {
  if (request.method !== 'GET') {
    next();
    return;
  }
  response.sendFile(join(distDir, 'index.html'));
});

const server = app.listen(portno, () => {
  const port = server.address().port;
  const base = 'http://localhost:' + port;
  console.log(base + ' хаягаар ' + distDir + ' хавтсыг үйлчилж байна');
  console.log('MongoDB-тэй холбогдсон эсэхийг шалгах: ' + base + '/test/info, ' + base + '/test/counts');
  if (!existsSync(distDir)) {
    console.log('dist/ хавтас алга. Эхлээд npm run build (эсвэл npm run build:w) командыг ажиллуулна уу.');
  }
});
