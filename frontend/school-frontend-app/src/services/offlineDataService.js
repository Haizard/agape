/**
 * Offline Data Service
 *
 * Provides functionality for storing and syncing data when offline
 * Uses IndexedDB for local storage
 */

// Database configuration
const DB_NAME = 'stjohnvianeyOfflineDB';
const DB_VERSION = 2; // Increased version for schema update
const STORES = {
  MARKS: 'marks',
  SYNC_QUEUE: 'syncQueue',
  STUDENTS: 'students',
  CLASSES: 'classes',
  SUBJECTS: 'subjects'
};

// Initialize the database
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create marks store
      if (!db.objectStoreNames.contains(STORES.MARKS)) {
        const marksStore = db.createObjectStore(STORES.MARKS, { keyPath: 'id' });
        marksStore.createIndex('studentId', 'studentId', { unique: false });
        marksStore.createIndex('subjectId', 'subjectId', { unique: false });
        marksStore.createIndex('academicYearId', 'academicYearId', { unique: false });
        marksStore.createIndex('termId', 'termId', { unique: false });
        marksStore.createIndex('classId', 'classId', { unique: false });
        marksStore.createIndex('synced', 'synced', { unique: false });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true
        });
        syncQueueStore.createIndex('status', 'status', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create students store
      if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
        const studentsStore = db.createObjectStore(STORES.STUDENTS, {
          keyPath: '_id'
        });
        studentsStore.createIndex('classId', 'classId', { unique: false });
        studentsStore.createIndex('admissionNumber', 'admissionNumber', { unique: false });
        studentsStore.createIndex('lastName', 'lastName', { unique: false });
        studentsStore.createIndex('synced', 'synced', { unique: false });
      }

      // Create classes store
      if (!db.objectStoreNames.contains(STORES.CLASSES)) {
        const classesStore = db.createObjectStore(STORES.CLASSES, {
          keyPath: '_id'
        });
        classesStore.createIndex('name', 'name', { unique: false });
        classesStore.createIndex('educationLevel', 'educationLevel', { unique: false });
        classesStore.createIndex('synced', 'synced', { unique: false });
      }

      // Create subjects store
      if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
        const subjectsStore = db.createObjectStore(STORES.SUBJECTS, {
          keyPath: '_id'
        });
        subjectsStore.createIndex('name', 'name', { unique: false });
        subjectsStore.createIndex('code', 'code', { unique: false });
        subjectsStore.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
};

// Generate a unique ID for offline records
const generateOfflineId = () => {
  return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Check if the browser is online
const isOnline = () => {
  return navigator.onLine;
};

// Add event listeners for online/offline status
const setupNetworkListeners = (onlineCallback, offlineCallback) => {
  window.addEventListener('online', () => {
    console.log('Browser is online');
    onlineCallback && onlineCallback();
  });

  window.addEventListener('offline', () => {
    console.log('Browser is offline');
    offlineCallback && offlineCallback();
  });
};

// Save marks data to IndexedDB
const saveMarksOffline = async (marksData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.MARKS], 'readwrite');
    const store = transaction.objectStore(STORES.MARKS);

    // Generate an offline ID if not provided
    if (!marksData.id) {
      marksData.id = generateOfflineId();
    }

    // Add timestamp
    marksData.timestamp = Date.now();
    marksData.synced = false;

    // Store the data
    const request = store.put(marksData);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // Add to sync queue
        addToSyncQueue({
          type: 'marks',
          action: 'save',
          data: marksData,
          status: 'pending'
        }).then(() => {
          resolve(marksData);
        }).catch(reject);
      };

      request.onerror = (event) => {
        console.error('Error saving marks offline:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to save marks offline:', error);
    throw error;
  }
};

// Get marks data from IndexedDB
const getMarksOffline = async (filters = {}) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.MARKS], 'readonly');
    const store = transaction.objectStore(STORES.MARKS);

    // Get all marks
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let results = request.result;

        // Apply filters if provided
        if (filters) {
          if (filters.studentId) {
            results = results.filter(mark => mark.studentId === filters.studentId);
          }
          if (filters.subjectId) {
            results = results.filter(mark => mark.subjectId === filters.subjectId);
          }
          if (filters.academicYearId) {
            results = results.filter(mark => mark.academicYearId === filters.academicYearId);
          }
          if (filters.termId) {
            results = results.filter(mark => mark.termId === filters.termId);
          }
          if (filters.classId) {
            results = results.filter(mark => mark.classId === filters.classId);
          }
        }

        resolve(results);
      };

      request.onerror = (event) => {
        console.error('Error getting marks offline:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to get marks offline:', error);
    throw error;
  }
};

// Add an item to the sync queue
const addToSyncQueue = async (item) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    // Add timestamp
    item.timestamp = Date.now();
    item.attempts = 0;

    // Store the item
    const request = store.add(item);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = (event) => {
        console.error('Error adding to sync queue:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
    throw error;
  }
};

// Get pending items from the sync queue
const getPendingSyncItems = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    // Get all pending items
    const request = index.getAll('pending');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('Error getting pending sync items:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to get pending sync items:', error);
    throw error;
  }
};

// Update sync item status
const updateSyncItemStatus = async (id, status, error = null) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    // Get the item first
    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error(`Sync item with id ${id} not found`));
          return;
        }

        // Update the item
        item.status = status;
        item.lastAttempt = Date.now();
        item.attempts += 1;

        if (error) {
          item.error = error.message || String(error);
        }

        // Put the updated item back
        const putRequest = store.put(item);

        putRequest.onsuccess = () => {
          resolve(item);
        };

        putRequest.onerror = (event) => {
          console.error('Error updating sync item:', event.target.error);
          reject(event.target.error);
        };
      };

      getRequest.onerror = (event) => {
        console.error('Error getting sync item:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to update sync item status:', error);
    throw error;
  }
};

// Mark a record as synced
const markAsSynced = async (id) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.MARKS], 'readwrite');
    const store = transaction.objectStore(STORES.MARKS);

    // Get the item first
    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error(`Mark with id ${id} not found`));
          return;
        }

        // Update the item
        item.synced = true;
        item.syncedAt = Date.now();

        // Put the updated item back
        const putRequest = store.put(item);

        putRequest.onsuccess = () => {
          resolve(item);
        };

        putRequest.onerror = (event) => {
          console.error('Error marking as synced:', event.target.error);
          reject(event.target.error);
        };
      };

      getRequest.onerror = (event) => {
        console.error('Error getting mark:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to mark as synced:', error);
    throw error;
  }
};

// Sync all pending items with the server
const syncWithServer = async (apiBaseUrl = '/api') => {
  if (!isOnline()) {
    console.log('Cannot sync while offline');
    return {
      success: false,
      message: 'Cannot sync while offline',
      synced: 0,
      failed: 0,
      pending: 0
    };
  }

  try {
    // Get all pending items
    const pendingItems = await getPendingSyncItems();

    if (pendingItems.length === 0) {
      return {
        success: true,
        message: 'No items to sync',
        synced: 0,
        failed: 0,
        pending: 0
      };
    }

    console.log(`Found ${pendingItems.length} items to sync`);

    let synced = 0;
    let failed = 0;

    // Process each item
    for (const item of pendingItems) {
      try {
        if (item.type === 'marks' && item.action === 'save') {
          // Get the marks data
          const marksData = item.data;

          // Check if it's an update or new record
          const isUpdate = !marksData.id.startsWith('offline_');

          // Prepare the API endpoint and method
          const endpoint = isUpdate
            ? `${apiBaseUrl}/marks/${marksData.id}`
            : `${apiBaseUrl}/marks`;

          const method = isUpdate ? 'PUT' : 'POST';

          // Remove offline-specific fields
          const dataToSend = { ...marksData };
          if (!isUpdate) {
            delete dataToSend.id;
          }
          delete dataToSend.timestamp;
          delete dataToSend.synced;
          delete dataToSend.syncedAt;

          // Send to server
          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(dataToSend)
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }

          // Get the server response
          const serverData = await response.json();

          // Mark the item as synced
          await updateSyncItemStatus(item.id, 'synced');

          // Mark the marks record as synced
          await markAsSynced(marksData.id);

          synced++;
        } else {
          console.warn(`Unknown sync item type or action: ${item.type} ${item.action}`);
          await updateSyncItemStatus(item.id, 'error', new Error('Unknown sync item type or action'));
          failed++;
        }
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        await updateSyncItemStatus(item.id, 'error', error);
        failed++;
      }
    }

    // Get updated count of pending items
    const remainingPendingItems = await getPendingSyncItems();

    return {
      success: true,
      message: `Synced ${synced} items, failed ${failed} items`,
      synced,
      failed,
      pending: remainingPendingItems.length
    };
  } catch (error) {
    console.error('Error during sync:', error);
    return {
      success: false,
      message: `Sync error: ${error.message}`,
      error: error.message,
      synced: 0,
      failed: 0,
      pending: 0
    };
  }
};

// Get sync status
const getSyncStatus = async () => {
  try {
    // Get all pending items
    const pendingItems = await getPendingSyncItems();

    // Get all marks
    const db = await initDB();
    const transaction = db.transaction([STORES.MARKS], 'readonly');
    const store = transaction.objectStore(STORES.MARKS);

    // Get all marks
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allMarks = request.result;
        const syncedMarks = allMarks.filter(mark => mark.synced);
        const unsyncedMarks = allMarks.filter(mark => !mark.synced);

        resolve({
          online: isOnline(),
          pendingSyncItems: pendingItems.length,
          totalMarks: allMarks.length,
          syncedMarks: syncedMarks.length,
          unsyncedMarks: unsyncedMarks.length
        });
      };

      request.onerror = (event) => {
        console.error('Error getting marks for sync status:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    throw error;
  }
};

// Clear all data (for testing/development)
const clearAllData = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.MARKS, STORES.SYNC_QUEUE], 'readwrite');
    const marksStore = transaction.objectStore(STORES.MARKS);
    const syncQueueStore = transaction.objectStore(STORES.SYNC_QUEUE);

    // Clear both stores
    marksStore.clear();
    syncQueueStore.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve({ success: true, message: 'All offline data cleared' });
      };

      transaction.onerror = (event) => {
        console.error('Error clearing offline data:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    throw error;
  }
};

// Save students data to IndexedDB
const saveStudentsOffline = async (students) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.STUDENTS], 'readwrite');
    const store = transaction.objectStore(STORES.STUDENTS);

    // Add timestamp and synced status
    const timestamp = Date.now();

    // Store each student
    const promises = students.map(student => {
      const studentData = {
        ...student,
        timestamp,
        synced: true // Students are considered synced when first saved
      };

      return new Promise((resolve, reject) => {
        const request = store.put(studentData);

        request.onsuccess = () => resolve(studentData);
        request.onerror = (event) => reject(event.target.error);
      });
    });

    return Promise.all(promises);
  } catch (error) {
    console.error('Failed to save students offline:', error);
    throw error;
  }
};

// Get students data from IndexedDB
const getStudentsOffline = async (classId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.STUDENTS], 'readonly');
    const store = transaction.objectStore(STORES.STUDENTS);

    // If classId is provided, use index to get students for that class
    let request;
    if (classId) {
      const index = store.index('classId');
      request = index.getAll(classId);
    } else {
      request = store.getAll();
    }

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Failed to get students offline:', error);
    throw error;
  }
};

// Save classes data to IndexedDB
const saveClassesOffline = async (classes) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.CLASSES], 'readwrite');
    const store = transaction.objectStore(STORES.CLASSES);

    // Add timestamp and synced status
    const timestamp = Date.now();

    // Store each class
    const promises = classes.map(classData => {
      const enhancedClassData = {
        ...classData,
        timestamp,
        synced: true // Classes are considered synced when first saved
      };

      return new Promise((resolve, reject) => {
        const request = store.put(enhancedClassData);

        request.onsuccess = () => resolve(enhancedClassData);
        request.onerror = (event) => reject(event.target.error);
      });
    });

    return Promise.all(promises);
  } catch (error) {
    console.error('Failed to save classes offline:', error);
    throw error;
  }
};

// Get classes data from IndexedDB
const getClassesOffline = async (educationLevel) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.CLASSES], 'readonly');
    const store = transaction.objectStore(STORES.CLASSES);

    // Get all classes
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let classes = request.result;

        // Filter by education level if provided
        if (educationLevel) {
          classes = classes.filter(cls => cls.educationLevel === educationLevel);
        }

        resolve(classes);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Failed to get classes offline:', error);
    throw error;
  }
};

// Save subjects data to IndexedDB
const saveSubjectsOffline = async (subjects) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.SUBJECTS], 'readwrite');
    const store = transaction.objectStore(STORES.SUBJECTS);

    // Add timestamp and synced status
    const timestamp = Date.now();

    // Store each subject
    const promises = subjects.map(subject => {
      const subjectData = {
        ...subject,
        timestamp,
        synced: true // Subjects are considered synced when first saved
      };

      return new Promise((resolve, reject) => {
        const request = store.put(subjectData);

        request.onsuccess = () => resolve(subjectData);
        request.onerror = (event) => reject(event.target.error);
      });
    });

    return Promise.all(promises);
  } catch (error) {
    console.error('Failed to save subjects offline:', error);
    throw error;
  }
};

// Get subjects data from IndexedDB
const getSubjectsOffline = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.SUBJECTS], 'readonly');
    const store = transaction.objectStore(STORES.SUBJECTS);

    // Get all subjects
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Failed to get subjects offline:', error);
    throw error;
  }
};

// Export the service functions
const offlineDataService = {
  initDB,
  isOnline,
  setupNetworkListeners,
  saveMarksOffline,
  getMarksOffline,
  saveStudentsOffline,
  getStudentsOffline,
  saveClassesOffline,
  getClassesOffline,
  saveSubjectsOffline,
  getSubjectsOffline,
  syncWithServer,
  getSyncStatus,
  clearAllData
};

export default offlineDataService;
