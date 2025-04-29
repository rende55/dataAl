Bir React.js + Material UI tabanlı gelişmiş bir veri yönetim paneli geliştiriyoruz. Aşağıdaki detaylara göre yapıyı kurmanı istiyorum. Uygulama kullanıcıların farklı projeler oluşturmasını ve bu projelerde JSON veri yönetimi yapabilmesini sağlayacak. Excel'den veri alma, tab/başlık oluşturma, düzenleme, silme, kaydetme gibi tüm işlemler kullanıcı dostu bir arayüzle yapılacak.

### 🎯 Genel Tanım:

- Uygulama birden fazla projeyi destekleyecek.
- Her proje için ayrı bir JSON dosyası oluşturulacak.
- Kullanıcı her projeyi ayrı ayrı yönetebilecek.
- Excel'den veri yükleme işlemi özel formatta çalışacak (aşağıda açıklanmıştır).

---

### 📁 Proje Yönetimi

1. **Proje Seçme / Ekleme Sistemi:**

   - Uygulama ilk açıldığında kullanıcıdan bir proje seçmesi veya yeni bir proje oluşturması istenecek.
   - Yeni proje oluşturulduğunda, proje adı girilir ve buna karşılık gelen bir JSON dosyası oluşturulur:
     - Format: `data_[projeAdi].json`
   - Her proje kendi bağımsız verisini tutar.
2. **Yeni proje oluşturulunca:**

   - `data_[projeAdi].json` adlı dosya sıfırdan yaratılır.
   - Bu dosya **boş olmalı**, yani içinde **hiçbir tab/bölüm (key)** bulunmamalı.
   - Başlangıçta ekranda gösterilecek herhangi bir sabit tablo (tab) **olmamalı**.

---

### 🧩 Tab Yönetimi

- Kullanıcı, yeni bir sekme/tab oluşturabilmeli (örneğin: `yapiSiniflari`, `yapiFiyatlari`, vs.).
- Var olan tabları silebilmelidir.
- Tab listesi tamamen dinamik olacak, JSON dosyasındaki key'lere göre oluşturulacak.
- Kullanıcı UI üzerinden tab ismi vererek yeni tablo yaratabilir.

---

### 📄 Excel'den Veri Alma Kuralları

- Kullanıcı bir Excel dosyası (.xlsx/.csv) yükleyebilmeli.
- Yüklenen Excel verisi şu şekilde işlenmeli:
  - İlk **satır**: Sütun başlıkları
  - İlk **sütun**: Satır başlıkları
  - `(0,0)` hücresi: Boş olacak ve **yok sayılacak** (çünkü satır ve sütun başlıklarının çakıştığı yer).
- Veriler, başlıklara göre nesne/dizi yapısında dönüştürülmeli.
- ID numarası otomatik olarak verilmesine gerek yok (id kullanmayacağız).

---

### 💾 Veri Kaydetme & Güncelleme

- Kullanıcı bir proje üzerinde değişiklik (tab ekleme, veri düzenleme, vs.) yaptığında,
- **“Güncelle” butonuna** bastığında,
- İlgili `data_[projeAdi].json` dosyası **tamamen güncellenmeli** (overwrite).
- Dosya sistemine yazılmasına gerek yoksa, bu işlem download linki olarak sunulabilir veya localStorage’a yazılabilir.

---

### 🧠 Özetle:

- Proje bazlı JSON dosyalarıyla çalışıyoruz.
- Her proje kendi `data_[projeAdi].json` dosyasını oluşturur ve günceller.
- Tablar tamamen dinamik, kullanıcı yönetimli olacak.
- Excel import özelleştirilmiş şekilde çalışacak (ilk satır ve sütun başlık, [0,0] yok say).
- Güncelleme işlemiyle dosya yeniden oluşturulacak.

Lütfen bu yapıya göre temiz, bileşen bazlı, modüler bir React uygulaması geliştir. Material UI kullanılmalı, arayüz sade, açıklayıcı ve kullanıcı dostu olmalı. Kodlama yaparken önce temel proje iskeletini kur, ardından sırasıyla:

- Proje yönetimi
- Tab yönetimi
- Excel’den veri alma ve dönüştürme
- JSON düzenleme ve kaydetme
  modüllerini geliştir.


### 🧠 Excel Veri Türü Algılama (Liste / Tablo)

Excel'den veri alırken sistem otomatik olarak aşağıdaki mantığı kullanarak veri türünü anlamaya çalışmalı:

#### 🔍 Algılama Kuralları:

- Eğer sadece **tek satır** veya **tek sütun** doluysa (örneğin 1xN veya Nx1):

  - Bu veri bir **liste verisi** olarak kabul edilir.
  - İlk hücre (A1 veya 1. hücre) **başlık** olarak alınır.
  - Diğer hücreler **o başlık altındaki elemanlar** olur.
  - Örnek: `["Yapı Türleri"] = ["Konut", "Ofis", "Villa"]`
- Eğer veri hem birden fazla satır hem sütun içeriyorsa:

  - `(0,0)` hücresi boş olmalı (çakışma noktası).
  - İlk satır ve ilk sütun **başlık** olarak alınır.
  - Geri kalan veriler başlıklara göre **tablo** olarak yapılandırılır.
  - Örnek: `{ "Konut": { "2022": 4500 }, "Villa": { "2022": 5500 } }`

#### 🧑‍⚖️ Kullanıcıya Seçim Sun (Opsiyonel):

- Eğer sistem otomatik olarak karar veremiyorsa (örneğin veri 2x2 gibi gri bir alandaysa),
- Kullanıcıya **"Bu veri tablo mu yoksa liste mi?"** sorusu gösterilmelidir.
- Böylece kullanıcı kendi verisini nasıl değerlendirmek istediğine karar verir.

#### 📦 JSON Formatı:

- Liste verisi JSON içinde bir `Array` veya `key: Array` şeklinde tutulabilir.

  - Örnek:
    ```json
    {
      "yapiTurleri": ["Konut", "Ofis", "Villa"]
    }
    ```
- Tablo verisi ise objeler veya iç içe objeler şeklinde tutulur.

Bu esneklik, kullanıcıların hem tablo hem de liste türü verileri Excel üzerinden kolayca yükleyebilmesini sağlar.
