let db;
let budget;

const request = indexedDB.open('budgetDB', budget || 21);

request.onupgradeneeded = function (e) {

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  const db = e.target.result;
  db.createObjectStore('budgetStore', { autoIncrement: true });

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('budgetStore', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Whoops! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('check db invoked');

  let transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(['budgetStore'], 'readwrite');

            const currentStore = transaction.objectStore('budgetStore');

            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

function saveRecord(record) {
  console.log('Save record invoked');

  const transaction = db.transaction(['budgetStore'], 'readwrite');
  const store = transaction.objectStore('budgetStore');

  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
