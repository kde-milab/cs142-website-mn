/**
 * ICSI301 Төсөл 6-ын веб API-гийн Mocha тест. Ажиллуулахдаа энэ (test) хавтас
 * дотроос:
 *   npm install     (анх удаа)
 *   npm test
 *
 * Тест ажиллуулахаас өмнө MongoDB болон веб сервер (node webServer.js)
 * ажиллаж байх ёстой бөгөөд өгөгдлийн санг node loadDatabase.js командаар
 * ачаалсан байх ёстой.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import icsi301models from '../src/modelData/photoApp.js';

const baseUrl = 'http://localhost:3000';

// Хэрэглэгчийн жагсаалтын моделийн зөвшөөрөгдөх шинжүүд
const userListProperties = ['first_name', 'last_name', '_id'];
// Хэрэглэгчийн дэлгэрэнгүй моделийн зөвшөөрөгдөх шинжүүд
const userDetailProperties = [
  'first_name',
  'last_name',
  '_id',
  'location',
  'description',
  'occupation',
];
// Зургийн моделийн зөвшөөрөгдөх шинжүүд
const photoProperties = ['file_name', 'date_time', 'user_id', '_id', 'comments'];
// Сэтгэгдлийн зөвшөөрөгдөх шинжүүд
const commentProperties = ['comment', 'date_time', '_id', 'user'];

/**
 * Веб серверт GET хүсэлт явуулж, HTTP төлөв болон хариуг буцаана. Хариу
 * JSON бол задалж (parse), үгүй бол текстээр нь буцаана.
 */
async function get(path) {
  const response = await fetch(baseUrl + path);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

/**
 * Объектод зөвшөөрөгдөөгүй (allowed жагсаалтад байхгүй) шинжүүдийг буцаана.
 */
function extraProperties(obj, allowed) {
  return Object.keys(obj).filter((key) => !allowed.includes(key));
}

function assertEqualDates(d1, d2) {
  assert.strictEqual(new Date(d1).valueOf(), new Date(d2).valueOf());
}

/**
 * Серверээс авсан хэрэглэгчдийн жагсаалтаас нэрээр нь хэрэглэгч хайна.
 */
function findUser(userList, realUser) {
  const user = userList.find(
    (u) => u.first_name === realUser.first_name && u.last_name === realUser.last_name
  );
  assert(user, realUser.first_name + ' ' + realUser.last_name + ' хэрэглэгч олдсонгүй');
  return user;
}

/**
 * /user/list-ээс хэрэглэгчдийн жагсаалтыг авна.
 */
async function getUserList() {
  const { status, body } = await get('/user/list');
  assert.strictEqual(status, 200, 'HTTP хариултын төлөв OK биш байна');
  return body;
}

describe('ICSI301 фото апп: Веб API тест', function () {
  describe('модель өгөгдөл ашиглаж байгаа эсэхийг шалгах', function () {
    it('webServer модель өгөгдөл ашиглахгүй байна', async function () {
      const source = await readFile(new URL('../webServer.js', import.meta.url), 'utf8');
      const regex = /^\s*import\s+icsi301models\s+from\s+['"]\.\/src\/modelData\/photoApp(\.js)?['"]/m;
      assert(!regex.test(source), 'webServer.js icsi301models-ийг ашигласан хэвээр байна.');
    });
  });

  describe('/user/list шалгах', function () {
    let userList;
    const icsi301Users = icsi301models.userListModel();

    it('хэрэглэгчдийн жагсаалтыг авч чадна', async function () {
      userList = await getUserList();
    });

    it('массив байна', function () {
      assert(Array.isArray(userList));
    });

    it('элементийн тоо зөв байна', function () {
      assert.strictEqual(userList.length, icsi301Users.length);
    });

    it('хэрэглэгч бүрт нэг бичлэг байна', function () {
      icsi301Users.forEach((realUser) => {
        const user = findUser(userList, realUser);
        const sameId = userList.filter((u) => u._id === user._id);
        assert.strictEqual(sameId.length, 1, user._id + ' id-тай олон хэрэглэгч байна');
        const extraProps = extraProperties(user, userListProperties);
        assert.strictEqual(
          extraProps.length,
          0,
          'хэрэглэгчийн объектод илүү шинж байна: ' + extraProps
        );
      });
    });
  });

  describe('/user/:id шалгах', function () {
    let userList;
    const icsi301Users = icsi301models.userListModel();

    it('хэрэглэгчдийн жагсаалтыг авч чадна', async function () {
      userList = await getUserList();
    });

    it('/user/:id-аар хэрэглэгч бүрийн дэлгэрэнгүйг авч чадна', async function () {
      // Хүсэлтүүдийг зэрэг явуулаад бүгд дуусахыг хүлээнэ.
      await Promise.all(
        icsi301Users.map(async (realUser) => {
          const id = findUser(userList, realUser)._id;
          const { status, body: userInfo } = await get('/user/' + id);
          assert.strictEqual(status, 200, 'HTTP хариултын төлөв OK биш байна');
          assert.strictEqual(userInfo._id, id);
          assert.strictEqual(userInfo.first_name, realUser.first_name);
          assert.strictEqual(userInfo.last_name, realUser.last_name);
          assert.strictEqual(userInfo.location, realUser.location);
          assert.strictEqual(userInfo.description, realUser.description);
          assert.strictEqual(userInfo.occupation, realUser.occupation);

          const extraProps = extraProperties(userInfo, userDetailProperties);
          assert.strictEqual(
            extraProps.length,
            0,
            'хэрэглэгчийн объектод илүү шинж байна: ' + extraProps
          );
        })
      );
    });

    it('буруу хэрэглэгчийн id-д 400 төлөв буцаана', async function () {
      const { status } = await get('/user/1');
      assert.strictEqual(status, 400);
    });
  });

  describe('/photosOfUser/:id шалгах', function () {
    let userList;
    const icsi301Users = icsi301models.userListModel();

    it('хэрэглэгчдийн жагсаалтыг авч чадна', async function () {
      userList = await getUserList();
    });

    it('/photosOfUser/:id-аар хэрэглэгч бүрийн зургийг авч чадна', async function () {
      await Promise.all(
        icsi301Users.map(async (realUser) => {
          const id = findUser(userList, realUser)._id;
          const { status, body: photos } = await get('/photosOfUser/' + id);
          assert.strictEqual(status, 200, 'HTTP хариултын төлөв OK биш байна');

          const realPhotos = icsi301models.photoOfUserModel(realUser._id);
          assert.strictEqual(photos.length, realPhotos.length, 'буцаасан зургийн тоо буруу');

          realPhotos.forEach((realPhoto) => {
            const matches = photos.filter((p) => p.file_name === realPhoto.file_name);
            assert.strictEqual(matches.length, 1, realPhoto.file_name + ' зургийг хайж байна');
            const photo = matches[0];
            const extraProps1 = extraProperties(photo, photoProperties);
            assert.strictEqual(
              extraProps1.length,
              0,
              'зургийн объектод илүү шинж байна: ' + extraProps1
            );
            assert.strictEqual(photo.user_id, id);
            assertEqualDates(photo.date_time, realPhoto.date_time);
            assert.strictEqual(photo.file_name, realPhoto.file_name);

            if (realPhoto.comments) {
              assert.strictEqual(
                photo.comments.length,
                realPhoto.comments.length,
                realPhoto.file_name + ' зургийн сэтгэгдлүүд'
              );

              realPhoto.comments.forEach((realComment) => {
                const comment = photo.comments.find((c) => c.comment === realComment.comment);
                assert(comment, 'сэтгэгдэл олдсонгүй: ' + realComment.comment);
                const extraProps2 = extraProperties(comment, commentProperties);
                assert.strictEqual(
                  extraProps2.length,
                  0,
                  'сэтгэгдлийн объектод илүү шинж байна: ' + extraProps2
                );
                assertEqualDates(comment.date_time, realComment.date_time);

                const extraProps3 = extraProperties(comment.user, userListProperties);
                assert.strictEqual(
                  extraProps3.length,
                  0,
                  'сэтгэгдлийн хэрэглэгчийн объектод илүү шинж байна: ' + extraProps3
                );
                assert.strictEqual(comment.user.first_name, realComment.user.first_name);
                assert.strictEqual(comment.user.last_name, realComment.user.last_name);
              });
            } else {
              assert(!photo.comments || photo.comments.length === 0);
            }
          });
        })
      );
    });

    it('photosOfUser-д буруу id өгвөл 400 төлөв буцаана', async function () {
      const { status } = await get('/photosOfUser/1');
      assert.strictEqual(status, 400);
    });
  });
});
