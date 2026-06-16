'use strict';

const DB_NAME = 'workMemoDB';
const DB_VERSION = 1;
const NOTE_STORE = 'notes';
const FILE_STORE = 'files';

let db;

/**
 * IndexedDBを開きます。
 * DB名を変えると別の保存領域になるため、通常は変更しないでください。
 */
function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME,DB_VERSION);

    req.onupgradeneeded = event => {
      const database = event.target.result;

      if(!database.objectStoreNames.contains(NOTE_STORE)){
        const notes = database.createObjectStore(NOTE_STORE,{keyPath:'id'});
        notes.createIndex('updatedAt','updatedAt');
      }

      if(!database.objectStoreNames.contains(FILE_STORE)){
        const files = database.createObjectStore(FILE_STORE,{keyPath:'id'});
        files.createIndex('noteId','noteId');
      }
    };

    req.onsuccess = event => {
      db = event.target.result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}

function store(name,mode='readonly'){
  if(!db){
    throw new Error('データベースが初期化されていません。');
  }
  return db.transaction(name,mode).objectStore(name);
}

function reqP(req){
  return new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function getAllNotes(){
  return reqP(store(NOTE_STORE).getAll());
}

async function getFilesByNote(noteId){
  return new Promise((resolve,reject)=>{
    const request = store(FILE_STORE).index('noteId').getAll(noteId);
    request.onsuccess=()=>resolve(request.result||[]);
    request.onerror=()=>reject(request.error);
  });
}

async function saveNoteRecord(note){
  return reqP(store(NOTE_STORE,'readwrite').put(note));
}

async function deleteNoteRecord(id){
  return reqP(store(NOTE_STORE,'readwrite').delete(id));
}

async function saveFileRecord(fileRecord){
  return reqP(store(FILE_STORE,'readwrite').put(fileRecord));
}

async function deleteFileRecord(id){
  return reqP(store(FILE_STORE,'readwrite').delete(id));
}

async function getFileRecord(id){
  return reqP(store(FILE_STORE).get(id));
}

async function getAllFileRecords(){
  return reqP(store(FILE_STORE).getAll());
}
